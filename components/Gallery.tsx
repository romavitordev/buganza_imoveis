"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import type { PublicPhotoDTO } from "@/lib/dto";
import { BLUR_DATA_URL } from "@/lib/blur";

interface GalleryProps {
  fotos: PublicPhotoDTO[];
  titulo: string;
  /** Vídeo do imóvel — entra na galeria APÓS as fotos, nunca como capa. */
  videoUrl?: string | null;
}

/** Item de mídia unificado: foto ou vídeo. */
type Midia =
  | { tipo: "foto"; url: string }
  | { tipo: "video"; url: string };

const DURACAO_FECHAR = 240; // deve casar com a animação bzZoomOut/bzBackdropOut

function prefereMenosMovimento(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Galeria da página de detalhe: mídia grande + thumbnails clicáveis e
 * lightbox com animação fluida. Fotos + vídeo convivem na mesma fileira
 * (padrão Mercado Livre): o vídeo é a última miniatura, com ícone de
 * play, e nunca é a capa.
 */
export default function Gallery({ fotos, titulo, videoUrl }: GalleryProps) {
  const ordenadas = fotos
    .slice()
    .sort((a, b) => Number(b.capa) - Number(a.capa) || a.ordem - b.ordem);

  // Mídias na ordem de exibição: fotos primeiro, vídeo por último
  const midias: Midia[] = [
    ...ordenadas.map((f): Midia => ({ tipo: "foto", url: f.url })),
    ...(videoUrl ? [{ tipo: "video" as const, url: videoUrl }] : []),
  ];
  const total = midias.length;
  const capaUrl = ordenadas[0]?.url;

  const [indiceAtivo, setIndiceAtivo] = useState(0);
  // montado = presente no DOM; fechando = tocando animação de saída
  const [montado, setMontado] = useState(false);
  const [fechando, setFechando] = useState(false);
  const timerRef = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fecharBtnRef = useRef<HTMLButtonElement>(null);
  // Elemento focado antes de abrir o lightbox — o foco volta para ele ao fechar
  const focoAnteriorRef = useRef<HTMLElement | null>(null);

  const navegar = useCallback(
    (delta: number) => {
      setIndiceAtivo((atual) => (atual + delta + total) % total);
    },
    [total]
  );

  const abrir = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    focoAnteriorRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setFechando(false);
    setMontado(true);
  }, []);

  const fechar = useCallback(() => {
    setFechando(true);
    const ms = prefereMenosMovimento() ? 0 : DURACAO_FECHAR;
    timerRef.current = window.setTimeout(() => {
      setMontado(false);
      setFechando(false);
      focoAnteriorRef.current?.focus();
    }, ms);
  }, []);

  // Swipe horizontal (mobile): troca de mídia na capa e no lightbox
  const toqueRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    toqueRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const inicio = toqueRef.current;
      toqueRef.current = null;
      if (!inicio || total < 2) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - inicio.x;
      const dy = t.clientY - inicio.y;
      // Gesto dominantemente horizontal e longo o bastante para ser intencional
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        navegar(dx < 0 ? 1 : -1);
      }
    },
    [navegar, total]
  );

  useEffect(() => {
    if (!montado) return;

    // Foco inicial no botão de fechar — leitores de tela anunciam o dialog
    fecharBtnRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") fechar();
      if (e.key === "ArrowLeft") navegar(-1);
      if (e.key === "ArrowRight") navegar(1);

      // Trap de foco: Tab circula apenas pelos controles do lightbox
      if (e.key === "Tab") {
        const focaveis = dialogRef.current?.querySelectorAll<HTMLElement>(
          "button, [href], video, [tabindex]:not([tabindex='-1'])"
        );
        if (!focaveis || focaveis.length === 0) return;
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        const atual = document.activeElement;
        if (e.shiftKey && (atual === primeiro || atual === document.body)) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && atual === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [montado, fechar, navegar]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  if (total === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-mist text-sm text-black/40">
        Fotos em breve — consulte pelo WhatsApp
      </div>
    );
  }

  const ativa = midias[indiceAtivo];
  const legenda = (i: number) =>
    midias[i].tipo === "video" ? "Vídeo do imóvel" : `Foto ${i + 1}`;

  return (
    <div className="flex flex-col gap-3">
      {/* Mídia principal. touch-pan-y: o navegador cuida do scroll
          vertical; swipe horizontal é nosso */}
      <div
        className="group relative aspect-[4/3] w-full touch-pan-y overflow-hidden rounded-2xl bg-mist"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {ativa.tipo === "foto" ? (
          <button
            type="button"
            onClick={abrir}
            className="absolute inset-0 block h-full w-full cursor-zoom-in"
            aria-label={`Ampliar foto ${indiceAtivo + 1} de ${total}`}
          >
            <Image
              src={ativa.url}
              alt={`${titulo} — foto ${indiceAtivo + 1}`}
              fill
              priority
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.03]"
            />
          </button>
        ) : (
          // key força remontar (e parar/reiniciar o player) ao voltar ao vídeo
          <video
            key={indiceAtivo}
            src={ativa.url}
            controls
            preload="metadata"
            playsInline
            className="absolute inset-0 h-full w-full bg-black object-contain"
          />
        )}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => navegar(-1)}
              aria-label="Mídia anterior"
              className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-[0_2px_12px_rgba(0,0,0,0.14)] backdrop-blur transition-all duration-200 ease-premium hover:scale-110 active:scale-95 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navegar(1)}
              aria-label="Próxima mídia"
              className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-[0_2px_12px_rgba(0,0,0,0.14)] backdrop-blur transition-all duration-200 ease-premium hover:scale-110 active:scale-95 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-pill bg-black/70 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
              {indiceAtivo + 1} / {total}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {total > 1 && (
        <div
          className="grid grid-cols-5 gap-2 md:grid-cols-6"
          role="group"
          aria-label="Miniaturas"
        >
          {midias.map((midia, i) => (
            <button
              key={`${midia.url}-${i}`}
              type="button"
              onClick={() => setIndiceAtivo(i)}
              aria-label={
                midia.tipo === "video"
                  ? "Reproduzir vídeo do imóvel"
                  : `Ver foto ${i + 1}`
              }
              aria-current={i === indiceAtivo ? "true" : undefined}
              className={`relative aspect-square overflow-hidden rounded-lg bg-mist transition-all duration-300 ease-premium ${
                i === indiceAtivo
                  ? "ring-2 ring-black ring-offset-2"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              {midia.tipo === "foto" ? (
                <Image
                  src={midia.url}
                  alt=""
                  fill
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  sizes="120px"
                  className="object-cover"
                />
              ) : (
                <>
                  {/* Capa como fundo escurecido + ícone de play (padrão ML) */}
                  {capaUrl && (
                    <Image
                      src={capaUrl}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover opacity-45"
                    />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-black shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                      <Play size={13} className="ml-0.5 fill-black" aria-hidden="true" />
                    </span>
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {montado && (
        <div
          ref={dialogRef}
          className={`bz-lightbox fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 ${
            fechando ? "bz-closing" : ""
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={`Galeria de ${titulo}`}
          onClick={fechar}
        >
          <button
            ref={fecharBtnRef}
            type="button"
            onClick={fechar}
            aria-label="Fechar galeria"
            className="bz-lightbox-controls absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-transform duration-200 ease-premium hover:scale-110 hover:bg-white/25 active:scale-95"
          >
            <X size={20} aria-hidden="true" />
          </button>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navegar(-1);
                }}
                aria-label="Mídia anterior"
                className="bz-lightbox-controls absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-transform duration-200 ease-premium hover:scale-110 hover:bg-white/25 active:scale-95 md:left-6"
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navegar(1);
                }}
                aria-label="Próxima mídia"
                className="bz-lightbox-controls absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-transform duration-200 ease-premium hover:scale-110 hover:bg-white/25 active:scale-95 md:right-6"
              >
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </>
          )}

          <div
            className="bz-lightbox-figure relative h-[80vh] w-full max-w-5xl touch-pan-y"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* key por índice → replay do fade / remonta o vídeo ao trocar */}
            <div key={indiceAtivo} className="bz-lightbox-img absolute inset-0">
              {ativa.tipo === "foto" ? (
                <Image
                  src={ativa.url}
                  alt={`${titulo} — foto ${indiceAtivo + 1}`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              ) : (
                <video
                  src={ativa.url}
                  controls
                  autoPlay
                  playsInline
                  className="h-full w-full object-contain"
                />
              )}
            </div>
          </div>

          {total > 1 && (
            <span
              aria-live="polite"
              className="bz-lightbox-controls absolute bottom-6 rounded-pill bg-white/10 px-4 py-1.5 text-[12px] font-medium text-white"
            >
              {legenda(indiceAtivo)} · {indiceAtivo + 1} / {total}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
