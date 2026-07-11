"use client";

import { Quote } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { DEPOIMENTOS, type Depoimento } from "@/lib/depoimentos";

/**
 * Carrossel de depoimentos: passa sozinho de tempos em tempos, o slide
 * central fica em foco (os vizinhos esmaecem) e dá para arrastar.
 * Pausa com o mouse em cima e respeita prefers-reduced-motion.
 */

// Lista duplicada: slides de sobra deixam o loop contínuo de verdade,
// mesmo com 3 visíveis (aprendizado do carrossel do TriAmici)
const SLIDES = [...DEPOIMENTOS, ...DEPOIMENTOS];

function CartaoDepoimento({
  depoimento,
  ativo,
}: {
  depoimento: Depoimento;
  ativo: boolean;
}) {
  return (
    <article
      className={`flex h-full flex-col gap-4 rounded-2xl border bg-white p-6 transition-all duration-500 ease-premium ${
        ativo
          ? "scale-100 border-black/25 opacity-100"
          : "scale-[0.93] border-black/10 opacity-40"
      }`}
    >
      <Quote
        size={22}
        strokeWidth={1.5}
        aria-hidden="true"
        className={`rotate-180 transition-colors duration-500 ${
          ativo ? "text-black" : "text-black/20"
        }`}
      />
      <p className="flex-1 text-[14px] leading-relaxed text-black/70">
        {depoimento.texto}
      </p>
      <div>
        <p className="text-sm font-semibold tracking-tight">
          {depoimento.nome}
        </p>
        <p className="mt-0.5 text-[12px] text-black/45">
          {depoimento.contexto}
        </p>
      </div>
    </article>
  );
}

export default function Depoimentos() {
  function aoIniciar(swiper: SwiperType) {
    // Quem pediu menos movimento no sistema não recebe carrossel andando
    // sozinho — ainda pode arrastar manualmente
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      swiper.autoplay?.stop();
    }
  }

  return (
    <section
      id="depoimentos"
      className="py-16 md:py-24"
      aria-labelledby="depoimentos-titulo"
    >
      <div className="bz-fade-up mx-auto mb-10 max-w-6xl px-4 md:px-8">
        <p className="mb-2 flex items-center gap-2 text-[13px] text-black/55">
          <span className="bz-dot" aria-hidden="true" />
          Quem já fechou negócio
        </p>
        <h2
          id="depoimentos-titulo"
          className="text-3xl tracking-tight md:text-4xl"
        >
          Clientes que viraram amigos
        </h2>
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <Swiper
          modules={[Autoplay]}
          loop
          centeredSlides
          grabCursor
          speed={700}
          autoplay={{
            delay: 4500,
            pauseOnMouseEnter: true,
            // Depois de arrastar, volta a passar sozinho
            disableOnInteraction: false,
          }}
          slidesPerView={1.15}
          spaceBetween={16}
          breakpoints={{
            768: { slidesPerView: 2.1, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
          }}
          onSwiper={aoIniciar}
          aria-label="Depoimentos de clientes"
        >
          {SLIDES.map((depoimento, i) => (
            <SwiperSlide key={`${depoimento.nome}-${i}`} className="!h-auto">
              {({ isActive }) => (
                <CartaoDepoimento depoimento={depoimento} ativo={isActive} />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
