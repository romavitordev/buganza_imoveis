import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  BedSingle,
  Car,
  LandPlot,
  MapPin,
  MessageCircle,
  Ruler,
} from "lucide-react";
import ComodidadesList from "@/components/ComodidadesList";
import ImoveisSemelhantes from "@/components/ImoveisSemelhantes";
import Gallery from "@/components/Gallery";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import ShareButton from "@/components/ShareButton";
import TrackView from "@/components/TrackView";
import WhatsAppLink from "@/components/WhatsAppLink";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";
import { toPublicPropertyDTO, toPublicPropertyDTOList, capaDoImovel } from "@/lib/dto";
import { ranquearSemelhantes } from "@/lib/semelhantes";
import { linkWhatsAppGeral, linkWhatsAppImovel } from "@/lib/whatsapp";
import { SUBTIPO_LABEL, TIPO_LABEL, TRANSACAO_LABEL } from "@/lib/labels";
import {
  formatarPreco,
  precoLocacaoFormatado,
} from "@/lib/format";

// ISR por slug: gerada sob demanda e servida do cache; mutações no admin
// invalidam via revalidatePath (lib/revalidate.ts)
export const revalidate = 300;
export const dynamicParams = true;

// Sem generateStaticParams o Next renderiza a rota a cada request
// (Cache-Control: no-store) — com ele, os ativos são pré-gerados no build
// e novos slugs entram no cache sob demanda
export async function generateStaticParams() {
  const imoveis = await prisma.property
    .findMany({ where: { status: "ATIVO" }, select: { slug: true } })
    // Banco fora do ar no build → nenhuma pré-gerada; todas sob demanda
    .catch(() => []);
  return imoveis.map(({ slug }) => ({ slug }));
}

interface PageProps {
  params: { slug: string };
}

// cache(): generateMetadata e a página pedem o mesmo imóvel na mesma
// renderização — deduplica para uma única query
const buscarImovelAtivo = cache(async (slug: string) => {
  const property = await prisma.property.findUnique({
    where: { slug },
    include: { fotos: { orderBy: { ordem: "asc" } } },
  });
  // Imóvel inexistente ou fora do ar → 404 (não vaza pausados/vendidos)
  if (!property || property.status !== "ATIVO") return null;
  return toPublicPropertyDTO(property);
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  // notFound() AQUI (antes do streaming do loading.tsx) garante status 404
  // de verdade para slugs inexistentes — sem soft-404 para o Google.
  const imovel = await buscarImovelAtivo(params.slug);
  if (!imovel) notFound();

  const capa = capaDoImovel(imovel);
  const descricao = `${TIPO_LABEL[imovel.tipo]} para ${TRANSACAO_LABEL[
    imovel.transacao
  ].toLowerCase()} em ${imovel.bairro}, ${imovel.cidade}. ${imovel.descricao
    .replace(/\s+/g, " ")
    .slice(0, 140)}…`;

  return {
    title: imovel.titulo,
    description: descricao,
    openGraph: {
      title: `${imovel.titulo} · Imóveis Buganza`,
      description: descricao,
      ...(capa ? { images: [{ url: capa.url }] } : {}),
    },
  };
}

export default async function ImovelPage({ params }: PageProps) {
  const imovel = await buscarImovelAtivo(params.slug);
  if (!imovel) notFound();

  // Imóveis parecidos: puxa candidatos ATIVOS da mesma cidade e ranqueia
  // por afinidade (lib/semelhantes.ts). Banco fora do ar → seção some.
  const semelhantes = await prisma.property
    .findMany({
      where: {
        status: "ATIVO",
        cidade: imovel.cidade,
        slug: { not: imovel.slug },
      },
      include: { fotos: { orderBy: { ordem: "asc" } } },
      orderBy: { atualizadoEm: "desc" },
      take: 12,
    })
    .then(toPublicPropertyDTOList)
    .then((lista) => ranquearSemelhantes(imovel, lista, 3))
    .catch(() => []);

  const whatsappHref = linkWhatsAppImovel(imovel.slug);
  const precoVenda = formatarPreco(imovel.precoVenda);
  const precoLocacao = precoLocacaoFormatado(imovel);
  const temPreco = Boolean(precoVenda) || Boolean(precoLocacao);
  const rotuloCta = temPreco
    ? "Tenho interesse — chamar no WhatsApp"
    : "Consultar valor no WhatsApp";

  // Custos recorrentes ficam junto do preço (é a conta que o comprador faz)
  const custos = [
    formatarPreco(imovel.condominioMensal)
      ? `Condomínio ${formatarPreco(imovel.condominioMensal)}/mês`
      : null,
    formatarPreco(imovel.iptuAnual)
      ? `IPTU ${formatarPreco(imovel.iptuAnual)}/ano`
      : null,
  ].filter(Boolean);

  // Só os números do imóvel — tipo/transação/localização vivem no cabeçalho
  const caracteristicas = [
    imovel.quartos !== null
      ? { icone: BedDouble, rotulo: "Quartos", valor: String(imovel.quartos) }
      : null,
    imovel.suites !== null && imovel.suites > 0
      ? { icone: BedSingle, rotulo: "Suítes", valor: String(imovel.suites) }
      : null,
    imovel.banheiros !== null
      ? { icone: Bath, rotulo: "Banheiros", valor: String(imovel.banheiros) }
      : null,
    imovel.vagas !== null
      ? { icone: Car, rotulo: "Vagas", valor: String(imovel.vagas) }
      : null,
    imovel.areaM2 !== null
      ? {
          icone: Ruler,
          rotulo: imovel.areaTerrenoM2 !== null ? "Área útil" : "Área",
          valor: `${imovel.areaM2} m²`,
        }
      : null,
    imovel.areaTerrenoM2 !== null
      ? {
          icone: LandPlot,
          rotulo: "Área do terreno",
          valor: `${imovel.areaTerrenoM2} m²`,
        }
      : null,
  ].filter(
    (c): c is { icone: typeof BedDouble; rotulo: string; valor: string } =>
      c !== null
  );

  // Dados estruturados (Google) — melhora a exibição nos resultados de busca
  const capa = capaDoImovel(imovel);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: imovel.titulo,
    description: imovel.descricao.replace(/\s+/g, " ").slice(0, 300),
    ...(capa ? { image: capa.url } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: imovel.cidade,
      addressRegion: "SP",
      addressCountry: "BR",
    },
    ...(imovel.precoVenda
      ? {
          offers: {
            "@type": "Offer",
            price: Number(imovel.precoVenda),
            priceCurrency: "BRL",
          },
        }
      : {}),
  };

  // Breadcrumbs estruturados — o Google mostra "Início › Imóveis › {título}"
  // no lugar da URL crua nos resultados de busca
  const base = siteUrl();
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: base },
      {
        "@type": "ListItem",
        position: 2,
        name: "Imóveis",
        item: `${base}/imoveis`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: imovel.titulo,
        item: `${base}/imoveis/${imovel.slug}`,
      },
    ],
  };

  return (
    <>
      <SiteNav whatsappHref={linkWhatsAppGeral()} />
      <TrackView slug={imovel.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="mx-auto max-w-6xl px-4 pb-44 pt-24 md:px-8 md:pb-20 md:pt-36">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/imoveis"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-black/55 transition-colors hover:text-black"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Voltar para o catálogo
          </Link>
          <ShareButton titulo={imovel.titulo} />
        </div>

        {/* Cabeçalho do anúncio — identidade completa antes de tudo */}
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-pill bg-black px-3 py-1 text-[11px] font-medium text-white">
              {imovel.subtipo
                ? SUBTIPO_LABEL[imovel.subtipo]
                : TIPO_LABEL[imovel.tipo]}
            </span>
            <span className="rounded-pill border border-black/15 px-3 py-1 text-[11px] font-medium text-black/70">
              {TRANSACAO_LABEL[imovel.transacao]}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-black/40">
              Cód. {imovel.codigo}
            </span>
          </div>
          <h1 className="max-w-3xl text-3xl leading-tight tracking-tight md:text-4xl">
            {imovel.titulo}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-black/55">
            <MapPin size={14} aria-hidden="true" />
            {imovel.bairro} · {imovel.cidade}
          </p>
        </header>

        {/* Topo: galeria + card de conversão lado a lado. O card fica
            ancorado ao lado das imagens (não segue o scroll); o conteúdo
            corre em largura cheia abaixo. No mobile, o card vem logo
            depois da galeria. */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          <Gallery fotos={imovel.fotos} titulo={imovel.titulo} />

          {/* Card de conversão: preço, custos, WhatsApp e o formulário de
              contato — tudo que fecha negócio num lugar só */}
          <aside
            aria-label="Preço e contato"
            className="rounded-2xl border border-black/10 bg-white p-6"
          >
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              {precoVenda && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-black/45">
                    Venda
                  </p>
                  <p className="text-3xl font-semibold tracking-tight">
                    {precoVenda}
                  </p>
                </div>
              )}
              {precoLocacao && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-black/45">
                    Locação
                  </p>
                  <p className="text-3xl font-semibold tracking-tight">
                    {precoLocacao}
                  </p>
                </div>
              )}
              {!temPreco && (
                <div>
                  <p className="text-3xl font-semibold tracking-tight">
                    Sob consulta
                  </p>
                  <p className="mt-1 text-[12px] text-black/50">
                    Chame no WhatsApp — respondemos rápido
                  </p>
                </div>
              )}
            </div>

            {custos.length > 0 && (
              <p className="mt-3 border-t border-black/8 pt-3 text-[12px] text-black/55">
                {custos.join(" · ")}
              </p>
            )}

            <WhatsAppLink
              href={whatsappHref}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-pill bg-black px-6 py-4 text-sm font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
            >
              <MessageCircle
                size={16}
                strokeWidth={2.5}
                className="text-[#25D366]"
                aria-hidden="true"
              />
              {rotuloCta}
            </WhatsAppLink>
            <p className="mt-2 text-center text-[11px] text-black/40">
              Resposta rápida · atendimento direto com os corretores
            </p>

            {/* Ficha de características no próprio card — preenche a coluna
                ao lado da galeria e resume os números do imóvel */}
            {caracteristicas.length > 0 && (
              <div className="mt-6 border-t border-black/10 pt-5">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-black/45">
                  Características
                </p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-4">
                  {caracteristicas.map(({ icone: Icone, rotulo, valor }) => (
                    <li key={rotulo} className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mist text-black/55">
                        <Icone size={16} strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-tight tracking-tight">
                          {valor}
                        </span>
                        <span className="block truncate text-[10px] font-medium uppercase tracking-wide text-black/45">
                          {rotulo}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        {/* Conteúdo em largura cheia, abaixo da galeria e do card */}
        <div className="mt-12 flex flex-col gap-10 md:mt-14">
            <ComodidadesList valores={imovel.comodidades} />

            <section aria-labelledby="descricao-titulo">
              <h2
                id="descricao-titulo"
                className="mb-3 text-lg font-normal tracking-tight"
              >
                Sobre este imóvel
              </h2>
              <div className="max-w-2xl space-y-3 text-[15px] leading-relaxed text-black/70">
                {imovel.descricao.split(/\n{2,}/).map((paragrafo, i) => (
                  <p key={i}>{paragrafo}</p>
                ))}
              </div>
            </section>

            {imovel.videoUrl && (
              <section aria-labelledby="video-imovel-titulo">
                <h2
                  id="video-imovel-titulo"
                  className="mb-3 text-lg font-normal tracking-tight"
                >
                  Vídeo do imóvel
                </h2>
                <video
                  src={imovel.videoUrl}
                  controls
                  preload="metadata"
                  playsInline
                  className="aspect-video w-full rounded-2xl bg-black"
                />
              </section>
            )}

            {/* Mapa: pino exato se o admin preencheu o endereço;
                senão, região do bairro (localização aproximada) */}
            <section aria-labelledby="mapa-imovel-titulo">
              <h2
                id="mapa-imovel-titulo"
                className="mb-3 text-lg font-normal tracking-tight"
              >
                Localização
              </h2>
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  imovel.enderecoMapa
                    ? `${imovel.enderecoMapa}, ${imovel.cidade}, SP`
                    : `${imovel.bairro}, ${imovel.cidade}, SP`
                )}&z=${imovel.enderecoMapa ? 16 : 14}&output=embed`}
                title={`Mapa de ${imovel.bairro}, ${imovel.cidade}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="aspect-video w-full rounded-2xl border border-black/10 grayscale transition-[filter] duration-500 ease-premium hover:grayscale-0"
              />
              <p className="mt-2 text-[12px] text-black/45">
                {imovel.enderecoMapa
                  ? `${imovel.enderecoMapa} · ${imovel.bairro}, ${imovel.cidade}`
                  : `Localização aproximada (${imovel.bairro}) — passamos o endereço completo no atendimento pelo WhatsApp.`}
              </p>
            </section>
        </div>

        {semelhantes.length > 0 && (
          <div className="mt-16 md:mt-24">
            <ImoveisSemelhantes imoveis={semelhantes} />
          </div>
        )}
      </main>

      {/* CTA sticky no mobile — acima da bottom nav */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-black/10 bg-white/95 p-3 backdrop-blur md:hidden">
        <WhatsAppLink
          href={whatsappHref}
          className="flex items-center justify-center gap-2 rounded-pill bg-black px-6 py-4 text-sm font-medium text-white"
        >
          <MessageCircle
            size={16}
            strokeWidth={2.5}
            className="text-[#25D366]"
            aria-hidden="true"
          />
          {rotuloCta}
        </WhatsAppLink>
      </div>

      <SiteFooter />
    </>
  );
}
