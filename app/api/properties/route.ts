import { NextResponse } from "next/server";
import { TipoImovel, Transacao } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toPublicPropertyDTOList } from "@/lib/dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ROTA PÚBLICA — somente imóveis ATIVOS, sempre via DTO com allowlist.
 * `precoInterno` jamais é serializado aqui (garantido por lib/dto.ts).
 * Filtros: ?tipo=RESIDENCIAL&transacao=VENDA&cidade=Sorocaba
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const tipoParam = searchParams.get("tipo");
  const transacaoParam = searchParams.get("transacao");
  const cidadeParam = searchParams.get("cidade");

  const tipo =
    tipoParam && (Object.values(TipoImovel) as string[]).includes(tipoParam)
      ? (tipoParam as TipoImovel)
      : undefined;

  const transacao =
    transacaoParam &&
    (Object.values(Transacao) as string[]).includes(transacaoParam)
      ? (transacaoParam as Transacao)
      : undefined;

  try {
    const properties = await prisma.property.findMany({
      where: {
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
      },
      include: { fotos: { orderBy: { ordem: "asc" } } },
      orderBy: [{ destaque: "desc" }, { atualizadoEm: "desc" }],
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
