import { NextResponse } from "next/server";
import { SubtipoImovel, TipoImovel, Transacao } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toPublicPropertyDTOList } from "@/lib/dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Inteiro 1..teto ou undefined (param inválido é ignorado, não erro). */
function inteiro(valor: string | null, teto: number): number | undefined {
  if (!valor) return undefined;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= teto ? n : undefined;
}

/**
 * Palavra que identifica o subtipo no título — o subtipo é OPCIONAL no
 * cadastro, e muito anúncio real fica sem ele. Filtrar só pelo campo
 * esconderia imóveis legítimos ("Casa Moderna no Campolim" com subtipo
 * vazio sumiria de uma busca por "casa"), então aceitamos também os
 * NÃO classificados cujo título diz o tipo.
 */
const PALAVRA_DO_SUBTIPO: Record<string, string> = {
  CASA: "casa",
  SOBRADO: "sobrado",
  APARTAMENTO: "apartamento",
  KITNET: "kitnet",
  CHACARA: "chácara",
  SALA_COMERCIAL: "sala",
  LOJA: "loja",
  GALPAO: "galpão",
};

/**
 * ROTA PÚBLICA — somente imóveis ATIVOS, sempre via DTO com allowlist.
 * `precoInterno` jamais é serializado aqui (garantido por lib/dto.ts).
 * Filtros: ?tipo=RESIDENCIAL&transacao=VENDA&cidade=Sorocaba&q=campolim
 *   + subtipo/bairro/quartosMin/vagasMin/precoMin/precoMax/limit — usados
 *   pela busca por conversa do chatbot (mesma lógica de faixa e a mesma
 *   igualdade exata de bairro do catálogo).
 * Favoritos: ?ids=id1,id2 (máx. 60) — usado pela página /favoritos
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const tipoParam = searchParams.get("tipo");
  const subtipoParam = searchParams.get("subtipo");
  const transacaoParam = searchParams.get("transacao");
  const cidadeParam = searchParams.get("cidade");
  const bairroParam = searchParams.get("bairro")?.trim() || undefined;
  const q = searchParams.get("q")?.trim().slice(0, 80) || undefined;
  const quartosMin = inteiro(searchParams.get("quartosMin"), 10);
  const vagasMin = inteiro(searchParams.get("vagasMin"), 10);
  const precoMin = inteiro(searchParams.get("precoMin"), 1_000_000_000);
  const precoMax = inteiro(searchParams.get("precoMax"), 1_000_000_000);
  const limit = inteiro(searchParams.get("limit"), 60);
  const ids = searchParams
    .get("ids")
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 60);

  // ?ids= presente porém vazio = "meus favoritos: nenhum" → lista vazia,
  // não o catálogo inteiro
  if (ids && ids.length === 0) {
    return NextResponse.json({ properties: [] });
  }

  const tipo =
    tipoParam && (Object.values(TipoImovel) as string[]).includes(tipoParam)
      ? (tipoParam as TipoImovel)
      : undefined;

  const subtipo =
    subtipoParam &&
    (Object.values(SubtipoImovel) as string[]).includes(subtipoParam)
      ? (subtipoParam as SubtipoImovel)
      : undefined;

  const transacao =
    transacaoParam &&
    (Object.values(Transacao) as string[]).includes(transacaoParam)
      ? (transacaoParam as Transacao)
      : undefined;

  // Subtipo tolerante: o classificado OU o não classificado cujo título
  // diz o tipo (ver PALAVRA_DO_SUBTIPO)
  const palavra = subtipo ? PALAVRA_DO_SUBTIPO[subtipo] : undefined;
  const condicaoSubtipo = subtipo
    ? {
        OR: [
          { subtipo },
          ...(palavra
            ? [
                {
                  subtipo: null,
                  titulo: { contains: palavra, mode: "insensitive" as const },
                },
              ]
            : []),
        ],
      }
    : undefined;

  // Faixa de preço: mesma regra do catálogo — olha o campo da transação
  // escolhida; sem transação, vale se QUALQUER um dos preços cair na faixa
  const faixa = {
    ...(precoMin !== undefined ? { gte: precoMin } : {}),
    ...(precoMax !== undefined ? { lte: precoMax } : {}),
  };
  const temFaixa = precoMin !== undefined || precoMax !== undefined;
  const condicaoPreco = temFaixa
    ? transacao === "LOCACAO"
      ? { precoLocacao: faixa }
      : transacao === "VENDA"
        ? { precoVenda: faixa }
        : { OR: [{ precoVenda: faixa }, { precoLocacao: faixa }] }
    : undefined;

  try {
    const properties = await prisma.property.findMany({
      where: {
        AND: [
          {
            status: "ATIVO",
            ...(tipo ? { tipo } : {}),
            ...(transacao
              ? {
                  // VENDA_LOCACAO atende tanto quem busca venda quanto locação
                  transacao:
                    transacao === "VENDA" || transacao === "LOCACAO"
                      ? { in: [transacao, "VENDA_LOCACAO"] }
                      : transacao,
                }
              : {}),
            ...(cidadeParam ? { cidade: cidadeParam } : {}),
            ...(bairroParam ? { bairro: bairroParam } : {}),
            ...(quartosMin !== undefined ? { quartos: { gte: quartosMin } } : {}),
            ...(vagasMin !== undefined ? { vagas: { gte: vagasMin } } : {}),
            ...(ids ? { id: { in: ids } } : {}),
          },
          ...(condicaoSubtipo ? [condicaoSubtipo] : []),
          ...(condicaoPreco ? [condicaoPreco] : []),
          ...(q
            ? [
                {
                  OR: [
                    { titulo: { contains: q, mode: "insensitive" as const } },
                    { descricao: { contains: q, mode: "insensitive" as const } },
                    { bairro: { contains: q, mode: "insensitive" as const } },
                    { cidade: { contains: q, mode: "insensitive" as const } },
                    { codigo: { contains: q, mode: "insensitive" as const } },
                  ],
                },
              ]
            : []),
        ],
      },
      include: { fotos: { orderBy: { ordem: "asc" } } },
      orderBy: [{ destaque: "desc" }, { atualizadoEm: "desc" }],
      ...(limit !== undefined ? { take: limit } : {}),
    });

    return NextResponse.json({
      properties: toPublicPropertyDTOList(properties),
    });
  } catch (e) {
    console.error("[public/properties GET]", e);
    return NextResponse.json(
      { erro: "Erro ao carregar os imóveis. Tente novamente." },
      { status: 500 }
    );
  }
}
