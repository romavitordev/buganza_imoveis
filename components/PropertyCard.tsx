import Image from "next/image";
import Link from "next/link";
import {
  BedDouble,
  Bath,
  Car,
  Ruler,
  MessageCircle,
  ImageOff,
} from "lucide-react";
import type { PublicPropertyDTO } from "@/lib/dto";
import { capaDoImovel } from "@/lib/dto";
import WhatsAppLink from "@/components/WhatsAppLink";
import { linkWhatsAppImovel } from "@/lib/whatsapp";
import { TIPO_LABEL, TRANSACAO_LABEL } from "@/lib/labels";
import { precoPrincipal, precoSecundario } from "@/lib/format";
import { BLUR_DATA_URL } from "@/lib/blur";

interface PropertyCardProps {
  imovel: PublicPropertyDTO;
  prioridade?: boolean;
}

export default function PropertyCard({
  imovel,
  prioridade,
}: PropertyCardProps) {
  const capa = capaDoImovel(imovel);
  const preco = precoPrincipal(imovel);
  const precoExtra = precoSecundario(imovel);

  const caracteristicas = [
    imovel.quartos !== null && {
      icone: BedDouble,
      texto: `${imovel.quartos} quarto${imovel.quartos === 1 ? "" : "s"}`,
    },
    imovel.banheiros !== null && {
      icone: Bath,
      texto: `${imovel.banheiros} banheiro${imovel.banheiros === 1 ? "" : "s"}`,
    },
    imovel.vagas !== null && {
      icone: Car,
      texto: `${imovel.vagas} vaga${imovel.vagas === 1 ? "" : "s"}`,
    },
    imovel.areaM2 !== null && {
      icone: Ruler,
      texto: `${imovel.areaM2} m²`,
    },
  ].filter((c): c is { icone: typeof BedDouble; texto: string } => Boolean(c));

  return (
    <article className="group flex h-full flex-col gap-4">
      <Link
        href={`/imoveis/${imovel.slug}`}
        className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-mist"
        aria-label={`Ver detalhes de ${imovel.titulo}`}
      >
        {capa ? (
          <Image
            src={capa.url}
            alt={imovel.titulo}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={prioridade}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-black/25">
            <ImageOff size={32} strokeWidth={1.5} aria-hidden="true" />
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-pill bg-white/90 px-3 py-1.5 text-[11px] font-medium text-black backdrop-blur">
          {TIPO_LABEL[imovel.tipo]} · {TRANSACAO_LABEL[imovel.transacao]}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-2 px-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-lg font-semibold tracking-tight">
            {preco ?? "Sob consulta"}
          </p>
          {precoExtra && (
            <p className="text-[12px] font-medium text-black/50">
              ou {precoExtra}
            </p>
          )}
        </div>

        <h3 className="text-base font-normal leading-snug tracking-tight">
          <Link
            href={`/imoveis/${imovel.slug}`}
            className="transition-opacity hover:opacity-70"
          >
            {imovel.titulo}
          </Link>
        </h3>
        <p className="text-sm text-black/55">
          {imovel.bairro} · {imovel.cidade}
        </p>

        {caracteristicas.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-2">
            {caracteristicas.map(({ icone: Icone, texto }) => (
              <li
                key={texto}
                className="flex items-center gap-1.5 rounded-pill border border-black/10 px-3 py-1 text-[11px] font-medium text-black/70 transition-colors group-hover:border-black/25"
              >
                <Icone size={12} strokeWidth={2} aria-hidden="true" />
                {texto}
              </li>
            ))}
          </ul>
        )}

        {/* mt-auto prende o CTA na base — cards sempre alinhados no grid */}
        <div className="mt-auto pt-3">
          <WhatsAppLink
            href={linkWhatsAppImovel(imovel.slug)}
            className="inline-flex w-fit items-center gap-2 rounded-pill bg-black px-5 py-2.5 text-[13px] font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
          >
            <MessageCircle
              size={14}
              strokeWidth={2.5}
              className="text-[#25D366]"
              aria-hidden="true"
            />
            Falar sobre este imóvel
          </WhatsAppLink>
        </div>
      </div>
    </article>
  );
}
