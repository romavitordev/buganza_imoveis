import { MessageCircle } from "lucide-react";
import { linkWhatsAppAnunciar } from "@/lib/whatsapp";

/** Captação de imóveis — CTA para proprietários que querem vender/alugar. */
export default function AnuncieBanner() {
  return (
    // marinho-fundo (o degrau mais escuro) em vez da tinta: a faixa é uma
    // superfície grande e ganha profundidade sendo mais funda que o resto.
    <section aria-labelledby="anuncie-titulo" className="bg-marinho-fundo">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-16 md:flex-row md:items-center md:justify-between md:px-8 md:py-20">
        <div className="bz-fade-up max-w-xl">
          {/* Aqui o dourado PODE ser letra: sobre o marinho fundo ele dá
              7:1, bem acima do mínimo. É o oposto do que vale no claro. */}
          <p className="mb-3 inline-flex items-center gap-2 rounded-pill border border-dourado/45 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-dourado-claro">
            Para proprietários
          </p>
          <h2
            id="anuncie-titulo"
            className="text-3xl leading-tight tracking-tight text-white md:text-4xl"
          >
            Quer vender ou alugar
            <br />
            <span className="font-medium">o seu imóvel?</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/65">
            Avaliação honesta, fotos caprichadas e divulgação para quem
            realmente procura. Você não paga nada para anunciar — só na
            conclusão do negócio.
          </p>
        </div>

        <a
          href={linkWhatsAppAnunciar()}
          target="_blank"
          rel="noopener noreferrer"
          className="bz-fade-up inline-flex flex-none items-center gap-2.5 rounded-pill bg-white px-8 py-4 text-sm font-medium text-black transition-transform duration-200 ease-premium hover:-translate-y-0.5"
        >
          {/* text-white explícito: o botão é branco com texto marinho, então
              sem isto o glifo herdaria marinho e sumiria no círculo. */}
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
            <MessageCircle
              size={13}
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </span>
          Anunciar meu imóvel
        </a>
      </div>
    </section>
  );
}
