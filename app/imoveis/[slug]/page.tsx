import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Car,
  MapPin,
  MessageCircle,
  Ruler,
  Tag,
} from "lucide-react";
import Gallery from "@/components/Gallery";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { toPublicPropertyDTO, capaDoImovel } from "@/lib/dto";
import { linkWhatsAppGeral, linkWhatsAppImovel } from "@/lib/whatsapp";
import { TIPO_LABEL, TRANSACAO_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

async function buscarImovelAtivo(slug: string) {
  const property = await prisma.property.findUnique({
    where: { slug },
    include: { fotos: { orderBy: { ordem: "asc" } } },
  });
  // Imóvel inexistente ou fora do ar → 404 (não vaza pausados/vendidos)
  if (!property || property.status !== "ATIVO") return null;
  return toPublicPropertyDTO(property);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const imovel = await buscarImovelAtivo(params.slug).catch(() => null);
  if (!imovel) return { title: "Imóvel não encontrado" };

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

  const whatsappHref = linkWhatsAppImovel(imovel.titulo, imovel.codigo);

  const caracteristicas = [
    { icone: Building2, rotulo: "Tipo", valor: TIPO_LABEL[imovel.tipo] },
    { icone: Tag, rotulo: "Transação", valor: TRANSACAO_LABEL[imovel.transacao] },
    {
      icone: MapPin,
      rotulo: "Localização",
      valor: `${imovel.bairro} · ${imovel.cidade}`,
    },
    imovel.quartos !== null
      ? {
          icone: BedDouble,
          rotulo: "Quartos",
          valor: String(imovel.quartos),
        }
      : null,
    imovel.banheiros !== null
      ? { icone: Bath, rotulo: "Banheiros", valor: String(imovel.banheiros) }
      : null,
    imovel.vagas !== null
      ? { icone: Car, rotulo: "Vagas", valor: String(imovel.vagas) }
      : null,
    imovel.areaM2 !== null
      ? { icone: Ruler, rotulo: "Área", valor: `${imovel.areaM2} m²` }
      : null,
  ].filter(
    (
      c
    ): c is { icone: typeof Building2; rotulo: string; valor: string } =>
      c !== null
  );

  return (
    <>
      <SiteNav whatsappHref={linkWhatsAppGeral()} />

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-28 md:px-8 md:pb-20 md:pt-36">
        <Link
          href="/imoveis"
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-black/55 transition-colors hover:text-black"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Voltar para o catálogo
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[3fr_2fr]">
          {/* Galeria */}
          <Gallery fotos={imovel.fotos} titulo={imovel.titulo} />

          {/* Ficha */}
          <div className="flex flex-col gap-6">
            <header>
              <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-black/40">
                Cód. {imovel.codigo}
              </p>
              <h1 className="text-3xl leading-tight tracking-tight md:text-4xl">
                {imovel.titulo}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-black/55">
                <MapPin size={14} aria-hidden="true" />
                {imovel.bairro} · {imovel.cidade}
              </p>
            </header>

            <ul className="flex flex-col divide-y divide-black/8 rounded-2xl border border-black/10">
              {caracteristicas.map(({ icone: Icone, rotulo, valor }) => (
                <li
                  key={rotulo}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <span className="flex items-center gap-2.5 text-[13px] text-black/55">
                    <Icone size={15} strokeWidth={1.75} aria-hidden="true" />
                    {rotulo}
                  </span>
                  <span className="text-[13px] font-medium">{valor}</span>
                </li>
              ))}
            </ul>

            {/* CTA desktop */}
            <div className="hidden flex-col gap-3 md:flex">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-pill bg-black px-7 py-4 text-sm font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
              >
                <MessageCircle
                  size={16}
                  strokeWidth={2.5}
                  className="text-[#25D366]"
                  aria-hidden="true"
                />
                Consultar valor no WhatsApp
              </a>
              <p className="text-center text-[11px] text-black/40">
                Resposta rápida · atendimento direto com os corretores
              </p>
            </div>

            <section aria-labelledby="descricao-titulo">
              <h2
                id="descricao-titulo"
                className="mb-3 text-lg font-normal tracking-tight"
              >
                Sobre este imóvel
              </h2>
              <div className="space-y-3 text-[15px] leading-relaxed text-black/70">
                {imovel.descricao.split(/\n{2,}/).map((paragrafo, i) => (
                  <p key={i}>{paragrafo}</p>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* CTA sticky no mobile */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 backdrop-blur md:hidden">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-pill bg-black px-6 py-4 text-sm font-medium text-white"
        >
          <MessageCircle
            size={16}
            strokeWidth={2.5}
            className="text-[#25D366]"
            aria-hidden="true"
          />
          Consultar valor no WhatsApp
        </a>
      </div>

      <SiteFooter />
    </>
  );
}
