import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, SearchX } from "lucide-react";
import { TipoImovel, Transacao } from "@prisma/client";
import PropertyCard from "@/components/PropertyCard";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { toPublicPropertyDTOList } from "@/lib/dto";
import { linkWhatsAppGeral } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Imóveis disponíveis",
  description:
    "Catálogo de imóveis residenciais e comerciais da Imóveis Buganza. Compra, venda e locação em Sorocaba e região.",
};

interface SearchParams {
  tipo?: string;
  transacao?: string;
  cidade?: string;
}

const FILTROS_TIPO: { label: string; valor?: TipoImovel }[] = [
  { label: "Todos" },
  { label: "Residencial", valor: "RESIDENCIAL" },
  { label: "Comercial", valor: "COMERCIAL" },
  { label: "Terreno", valor: "TERRENO" },
];

const FILTROS_TRANSACAO: { label: string; valor?: Transacao }[] = [
  { label: "Todos" },
  { label: "Venda", valor: "VENDA" },
  { label: "Locação", valor: "LOCACAO" },
];

function urlComFiltros(params: SearchParams): string {
  const query = new URLSearchParams();
  if (params.tipo) query.set("tipo", params.tipo);
  if (params.transacao) query.set("transacao", params.transacao);
  if (params.cidade) query.set("cidade", params.cidade);
  const texto = query.toString();
  return texto ? `/imoveis?${texto}` : "/imoveis";
}

function FilterPill({
  ativo,
  href,
  children,
}: {
  ativo: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={ativo ? "true" : undefined}
      className={`rounded-pill border px-4 py-2 text-[12px] font-medium transition-colors ${
        ativo
          ? "border-black bg-black text-white"
          : "border-black/12 bg-white text-black/70 hover:border-black/40"
      }`}
    >
      {children}
    </Link>
  );
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

  const transacao = (Object.values(Transacao) as string[]).includes(
    searchParams.transacao ?? ""
  )
    ? (searchParams.transacao as Transacao)
    : undefined;

  const cidadeParam = searchParams.cidade?.trim() || undefined;

  const [imoveis, cidades] = await Promise.all([
    prisma.property
      .findMany({
        where: {
          status: "ATIVO",
          ...(tipo ? { tipo } : {}),
          ...(transacao
            ? { transacao: { in: [transacao, "VENDA_LOCACAO"] } }
            : {}),
          ...(cidadeParam ? { cidade: cidadeParam } : {}),
        },
        include: { fotos: { orderBy: { ordem: "asc" } } },
        orderBy: [{ destaque: "desc" }, { atualizadoEm: "desc" }],
      })
      .then(toPublicPropertyDTOList)
      // Banco indisponível → catálogo vazio com convite ao WhatsApp,
      // em vez de derrubar a página
      .catch(() => []),
    prisma.property
      .findMany({
        where: { status: "ATIVO" },
        select: { cidade: true },
        distinct: ["cidade"],
        orderBy: { cidade: "asc" },
      })
      .then((linhas) => linhas.map((l) => l.cidade))
      .catch(() => []),
  ]);

  const filtrosAtuais: SearchParams = {
    tipo,
    transacao,
    cidade: cidadeParam,
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

        {/* Filtros */}
        <div className="mb-12 flex flex-col gap-4">
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filtrar por tipo"
          >
            <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-black/40">
              Tipo
            </span>
            {FILTROS_TIPO.map(({ label, valor }) => (
              <FilterPill
                key={label}
                ativo={tipo === valor}
                href={urlComFiltros({ ...filtrosAtuais, tipo: valor })}
              >
                {label}
              </FilterPill>
            ))}
          </div>

          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filtrar por transação"
          >
            <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-black/40">
              Transação
            </span>
            {FILTROS_TRANSACAO.map(({ label, valor }) => (
              <FilterPill
                key={label}
                ativo={transacao === valor}
                href={urlComFiltros({ ...filtrosAtuais, transacao: valor })}
              >
                {label}
              </FilterPill>
            ))}
          </div>

          {cidades.length > 1 && (
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Filtrar por cidade"
            >
              <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-black/40">
                Cidade
              </span>
              <FilterPill
                ativo={!cidadeParam}
                href={urlComFiltros({ ...filtrosAtuais, cidade: undefined })}
              >
                Todas
              </FilterPill>
              {cidades.map((cidade) => (
                <FilterPill
                  key={cidade}
                  ativo={cidadeParam === cidade}
                  href={urlComFiltros({ ...filtrosAtuais, cidade })}
                >
                  {cidade}
                </FilterPill>
              ))}
            </div>
          )}
        </div>

        {/* Resultados */}
        {imoveis.length > 0 ? (
          <>
            <p className="mb-8 text-[13px] text-black/45">
              {imoveis.length} imóve{imoveis.length === 1 ? "l" : "is"}{" "}
              encontrado{imoveis.length === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
              {imoveis.map((imovel, i) => (
                <PropertyCard
                  key={imovel.id}
                  imovel={imovel}
                  prioridade={i < 3}
                />
              ))}
            </div>
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
