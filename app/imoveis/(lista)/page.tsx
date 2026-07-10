import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  SearchX,
} from "lucide-react";
import { Prisma, TipoImovel, Transacao } from "@prisma/client";
import PropertyCard from "@/components/PropertyCard";
import CatalogoFiltros, {
  type FiltrosCatalogo,
} from "@/components/CatalogoFiltros";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { toPublicPropertyDTOList } from "@/lib/dto";
import { linkWhatsAppGeral } from "@/lib/whatsapp";
import { normalizarPreco } from "@/lib/preco";

// A página lê searchParams (filtros/busca/ordenação) — renderização dinâmica
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Imóveis disponíveis",
  description:
    "Catálogo de imóveis residenciais e comerciais da Imóveis Buganza. Compra, venda e locação em Sorocaba e região.",
  // Combinações de filtros geram URLs infinitas — o Google indexa só /imoveis
  alternates: { canonical: "/imoveis" },
};

const POR_PAGINA = 12;

interface SearchParams {
  tipo?: string;
  transacao?: string;
  cidade?: string;
  bairro?: string;
  quartos?: string;
  precoMin?: string;
  precoMax?: string;
  q?: string;
  ordem?: string;
  pagina?: string;
}

type Ordem = "recentes" | "preco-asc" | "preco-desc";

function inteiroPositivo(valor: string | undefined, max: number): number | undefined {
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= max ? n : undefined;
}

function precoDaUrl(valor: string | undefined): number | undefined {
  const n = normalizarPreco(valor ?? "");
  return n !== null && !Number.isNaN(n) && n > 0 ? n : undefined;
}

function urlDaPagina(filtros: FiltrosCatalogo, pagina: number): string {
  const query = new URLSearchParams();
  if (filtros.q) query.set("q", filtros.q);
  if (filtros.tipo) query.set("tipo", filtros.tipo);
  if (filtros.transacao) query.set("transacao", filtros.transacao);
  if (filtros.cidade) query.set("cidade", filtros.cidade);
  if (filtros.bairro) query.set("bairro", filtros.bairro);
  if (filtros.quartos) query.set("quartos", String(filtros.quartos));
  if (filtros.precoMin) query.set("precoMin", String(filtros.precoMin));
  if (filtros.precoMax) query.set("precoMax", String(filtros.precoMax));
  if (filtros.ordem !== "recentes") query.set("ordem", filtros.ordem);
  if (pagina > 1) query.set("pagina", String(pagina));
  const texto = query.toString();
  return texto ? `/imoveis?${texto}` : "/imoveis";
}

export default async function ImoveisPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const tipo = (Object.values(TipoImovel) as string[]).includes(
    searchParams.tipo ?? ""
  )
    ? (searchParams.tipo as TipoImovel)
    : undefined;

  const transacao =
    searchParams.transacao === "VENDA" || searchParams.transacao === "LOCACAO"
      ? (searchParams.transacao as Transacao)
      : undefined;

  const cidade = searchParams.cidade?.trim() || undefined;
  const bairro = searchParams.bairro?.trim() || undefined;
  const quartosMin = inteiroPositivo(searchParams.quartos, 10);
  const precoMin = precoDaUrl(searchParams.precoMin);
  const precoMax = precoDaUrl(searchParams.precoMax);
  // Busca livre: limitada a 80 chars para evitar queries abusivas
  const q = searchParams.q?.trim().slice(0, 80) || undefined;
  const ordem: Ordem = ["preco-asc", "preco-desc"].includes(
    searchParams.ordem ?? ""
  )
    ? (searchParams.ordem as Ordem)
    : "recentes";

  // Faixa de preço olha o campo da transação escolhida; sem transação,
  // vale se QUALQUER um dos preços cair na faixa
  const faixa: Prisma.DecimalNullableFilter = {
    ...(precoMin !== undefined ? { gte: precoMin } : {}),
    ...(precoMax !== undefined ? { lte: precoMax } : {}),
  };
  const temFaixa = precoMin !== undefined || precoMax !== undefined;

  const condicoes: Prisma.PropertyWhereInput[] = [];
  if (q) {
    condicoes.push({
      OR: [
        { titulo: { contains: q, mode: "insensitive" } },
        { descricao: { contains: q, mode: "insensitive" } },
        { bairro: { contains: q, mode: "insensitive" } },
        { cidade: { contains: q, mode: "insensitive" } },
        { codigo: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (temFaixa) {
    condicoes.push(
      transacao === "LOCACAO"
        ? { precoLocacao: faixa }
        : transacao === "VENDA"
          ? { precoVenda: faixa }
          : { OR: [{ precoVenda: faixa }, { precoLocacao: faixa }] }
    );
  }

  const where: Prisma.PropertyWhereInput = {
    status: "ATIVO",
    ...(tipo ? { tipo } : {}),
    ...(transacao
      ? { transacao: { in: [transacao, "VENDA_LOCACAO"] } }
      : {}),
    ...(cidade ? { cidade } : {}),
    ...(bairro ? { bairro } : {}),
    ...(quartosMin ? { quartos: { gte: quartosMin } } : {}),
    ...(condicoes.length > 0 ? { AND: condicoes } : {}),
  };

  // Ordenação no BANCO (não em memória): obrigatório para a paginação
  // fatiar a lista já na ordem certa. "Sob consulta" (preço null) no fim.
  const orderBy: Prisma.PropertyOrderByWithRelationInput[] =
    ordem === "recentes"
      ? [{ destaque: "desc" }, { atualizadoEm: "desc" }]
      : transacao === "LOCACAO"
        ? [
            {
              precoLocacao: {
                sort: ordem === "preco-asc" ? "asc" : "desc",
                nulls: "last",
              },
            },
          ]
        : [
            {
              precoVenda: {
                sort: ordem === "preco-asc" ? "asc" : "desc",
                nulls: "last",
              },
            },
            {
              precoLocacao: {
                sort: ordem === "preco-asc" ? "asc" : "desc",
                nulls: "last",
              },
            },
          ];

  const [total, cidades, bairros] = await Promise.all([
    prisma.property.count({ where }).catch(() => 0),
    prisma.property
      .findMany({
        where: { status: "ATIVO" },
        select: { cidade: true },
        distinct: ["cidade"],
        orderBy: { cidade: "asc" },
      })
      .then((linhas) => linhas.map((l) => l.cidade))
      .catch(() => []),
    prisma.property
      .findMany({
        where: { status: "ATIVO", ...(cidade ? { cidade } : {}) },
        select: { bairro: true },
        distinct: ["bairro"],
        orderBy: { bairro: "asc" },
      })
      .then((linhas) => linhas.map((l) => l.bairro))
      .catch(() => []),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const pagina = Math.min(
    inteiroPositivo(searchParams.pagina, 10_000) ?? 1,
    totalPaginas
  );

  const imoveis = await prisma.property
    .findMany({
      where,
      include: { fotos: { orderBy: { ordem: "asc" } } },
      orderBy,
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    })
    .then(toPublicPropertyDTOList)
    // Banco indisponível → catálogo vazio com convite ao WhatsApp,
    // em vez de derrubar a página
    .catch(() => []);

  const filtros: FiltrosCatalogo = {
    q,
    tipo,
    transacao,
    cidade,
    bairro,
    quartos: quartosMin,
    precoMin,
    precoMax,
    ordem,
  };

  return (
    <>
      <SiteNav whatsappHref={linkWhatsAppGeral()} />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 md:px-8 md:pt-36">
        <header className="bz-fade-up mb-10">
          <p className="mb-2 flex items-center gap-2 text-[13px] text-black/55">
            <span className="bz-dot" aria-hidden="true" />
            Catálogo completo
          </p>
          <h1 className="text-4xl tracking-tight md:text-5xl">Imóveis</h1>
        </header>

        <CatalogoFiltros
          filtros={filtros}
          cidades={cidades}
          bairros={bairros}
          total={total}
        />

        {/* Resultados */}
        {imoveis.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
              {imoveis.map((imovel, i) => (
                <PropertyCard
                  key={imovel.id}
                  imovel={imovel}
                  prioridade={i < 3}
                />
              ))}
            </div>

            {totalPaginas > 1 && (
              <nav
                aria-label="Paginação do catálogo"
                className="mt-14 flex items-center justify-center gap-2"
              >
                {pagina > 1 ? (
                  <Link
                    href={urlDaPagina(filtros, pagina - 1)}
                    aria-label="Página anterior"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 transition-colors hover:border-black"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-black/8 text-black/25">
                    <ChevronLeft size={16} aria-hidden="true" />
                  </span>
                )}

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                  (n) => (
                    <Link
                      key={n}
                      href={urlDaPagina(filtros, n)}
                      aria-current={n === pagina ? "page" : undefined}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-medium transition-colors ${
                        n === pagina
                          ? "bg-black text-white"
                          : "border border-black/15 hover:border-black"
                      }`}
                    >
                      {n}
                    </Link>
                  )
                )}

                {pagina < totalPaginas ? (
                  <Link
                    href={urlDaPagina(filtros, pagina + 1)}
                    aria-label="Próxima página"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 transition-colors hover:border-black"
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-black/8 text-black/25">
                    <ChevronRight size={16} aria-hidden="true" />
                  </span>
                )}
              </nav>
            )}
          </>
        ) : (
          <div className="bz-fade-up flex flex-col items-center gap-5 rounded-2xl bg-mist px-6 py-20 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black/40">
              <SearchX size={24} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div>
              <h2 className="mb-2 text-2xl tracking-tight">
                Nenhum imóvel com esses filtros — por enquanto.
              </h2>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-black/55">
                Nosso catálogo muda toda semana e nem tudo chega a ser
                publicado. Conte pelo WhatsApp o que você procura e vamos
                atrás do imóvel certo para você.
              </p>
            </div>
            <a
              href={linkWhatsAppGeral()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-pill bg-black px-6 py-3 text-[13px] font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
            >
              <MessageCircle
                size={15}
                strokeWidth={2.5}
                className="text-[#25D366]"
                aria-hidden="true"
              />
              Falar no WhatsApp
            </a>
          </div>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
