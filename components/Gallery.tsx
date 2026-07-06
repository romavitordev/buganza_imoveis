"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PublicPhotoDTO } from "@/lib/dto";

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

  const total = ordenadas.length;

  const navegar = useCallback(
    (delta: number) => {
      setIndiceAtivo((atual) => (atual + delta + total) % total);
    },
    [total]
  );

  const abrir = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setFechando(false);
    setMontado(true);
  }, []);

  const fechar = useCallback(() => {
    setFechando(true);
    const ms = prefereMenosMovimento() ? 0 : DURACAO_FECHAR;
    timerRef.current = window.setTimeout(() => {
      setMontado(false);
      setFechando(false);
    }, ms);
  }, []);

  useEffect(() => {
    if (!montado) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") fechar();
      if (e.key === "ArrowLeft") navegar(-1);
      if (e.key === "ArrowRight") navegar(1);
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
      {/* Foto principal */}
      <button
        type="button"
        onClick={abrir}
        className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-mist"
        aria-label={`Ampliar foto ${indiceAtivo + 1} de ${total}`}
      >
        <Image
          src={ativa.url}
          alt={`${titulo} — foto ${indiceAtivo + 1} de ${total}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.03]"
        />
        {total > 1 && (
          <span className="absolute bottom-3 right-3 rounded-pill bg-black/70 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
            {indiceAtivo + 1} / {total}
          </span>
        )}
      </button>

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
          className={`bz-lightbox fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 ${
            fechando ? "bz-closing" : ""
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={`Galeria de fotos de ${titulo}`}
          onClick={fechar}
        >
          <button
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
            className="bz-lightbox-figure relative h-[80vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
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
            <span className="bz-lightbox-controls absolute bottom-6 rounded-pill bg-white/10 px-4 py-1.5 text-[12px] font-medium text-white">
              {indiceAtivo + 1} / {total}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
