"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PublicPhotoDTO } from "@/lib/dto";
import { BLUR_DATA_URL } from "@/lib/blur";

interface GalleryProps {
  fotos: PublicPhotoDTO[];
  titulo: string;
}

const DURACAO_FECHAR = 240; // deve casar com a animação bzZoomOut/bzBackdropOut

function prefereMenosMovimento(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Galeria da página de detalhe: capa grande + thumbnails clicáveis e
 * lightbox com animação fluida de abrir/fechar, transição ao trocar de
 * foto e navegação por teclado.
 */
export default function Gallery({ fotos, titulo }: GalleryProps) {
  const ordenadas = fotos
    .slice()
    .sort((a, b) => Number(b.capa) - Number(a.capa) || a.ordem - b.ordem);

  const [indiceAtivo, setIndiceAtivo] = useState(0);
  // montado = presente no DOM; fechando = tocando animação de saída
  const [montado, setMontado] = useState(false);
  const [fechando, setFechando] = useState(false);
  const timerRef = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fecharBtnRef = useRef<HTMLButtonElement>(null);
  // Elemento focado antes de abrir o lightbox — o foco volta para ele ao fechar
  const focoAnteriorRef = useRef<HTMLElement | null>(null);

  const total = ordenadas.length;

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

  // Swipe horizontal (mobile): troca de foto na capa e no lightbox
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
          "button, [href], [tabindex]:not([tabindex='-1'])"
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

  const ativa = ordenadas[indiceAtivo];

  return (
    <div className="flex flex-col gap-3">
      {/* Foto principal — setas prev/next direto na capa, sem abrir o lightbox.
          touch-pan-y: o navegador cuida do scroll vertical; swipe horizontal é nosso */}
      <div
        className="group relative aspect-[4/3] w-full touch-pan-y overflow-hidden rounded-2xl bg-mist"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          onClick={abrir}
          className="absolute inset-0 block h-full w-full cursor-zoom-in"
          aria-label={`Ampliar foto ${indiceAtivo + 1} de ${total}`}
        >
          <Image
            src={ativa.url}
            alt={`${titulo} — foto ${indiceAtivo + 1} de ${total}`}
            fill
            priority
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.03]"
          />
        </button>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => navegar(-1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-[0_2px_12px_rgba(0,0,0,0.14)] backdrop-blur transition-all duration-200 ease-premium hover:scale-110 active:scale-95 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navegar(1)}
              aria-label="Próxima foto"
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
          aria-label="Miniaturas das fotos"
        >
          {ordenadas.map((foto, i) => (
            <button
              key={`${foto.url}-${i}`}
              type="button"
              onClick={() => setIndiceAtivo(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === indiceAtivo ? "true" : undefined}
              className={`relative aspect-square overflow-hidden rounded-lg bg-mist transition-all duration-300 ease-premium ${
                i === indiceAtivo
                  ? "ring-2 ring-black ring-offset-2"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={foto.url}
                alt=""
                fill
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes="120px"
                className="object-cover"
              />
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
          aria-label={`Galeria de fotos de ${titulo}`}
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
                aria-label="Foto anterior"
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
                aria-label="Próxima foto"
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
            {/* key por índice → replay do fade a cada troca de foto */}
            <div key={indiceAtivo} className="bz-lightbox-img absolute inset-0">
              <Image
                src={ativa.url}
                alt={`${titulo} — foto ${indiceAtivo + 1} de ${total}`}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>

          {total > 1 && (
            <span
              aria-live="polite"
              className="bz-lightbox-controls absolute bottom-6 rounded-pill bg-white/10 px-4 py-1.5 text-[12px] font-medium text-white"
            >
              {indiceAtivo + 1} / {total}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
