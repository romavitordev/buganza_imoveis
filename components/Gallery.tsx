"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PublicPhotoDTO } from "@/lib/dto";

interface GalleryProps {
  fotos: PublicPhotoDTO[];
  titulo: string;
}

/**
 * Galeria da página de detalhe: capa grande + thumbnails clicáveis
 * e lightbox simples com navegação por teclado.
 */
export default function Gallery({ fotos, titulo }: GalleryProps) {
  const ordenadas = fotos
    .slice()
    .sort((a, b) => Number(b.capa) - Number(a.capa) || a.ordem - b.ordem);

  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const [lightboxAberto, setLightboxAberto] = useState(false);

  const total = ordenadas.length;

  const navegar = useCallback(
    (delta: number) => {
      setIndiceAtivo((atual) => (atual + delta + total) % total);
    },
    [total]
  );

  useEffect(() => {
    if (!lightboxAberto) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxAberto(false);
      if (e.key === "ArrowLeft") navegar(-1);
      if (e.key === "ArrowRight") navegar(1);
    }

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxAberto, navegar]);

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
        onClick={() => setLightboxAberto(true)}
        className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-mist"
        aria-label={`Ampliar foto ${indiceAtivo + 1} de ${total}`}
      >
        <Image
          src={ativa.url}
          alt={`${titulo} — foto ${indiceAtivo + 1} de ${total}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
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
              className={`relative aspect-square overflow-hidden rounded-lg bg-mist transition-opacity ${
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
      {lightboxAberto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Galeria de fotos de ${titulo}`}
          onClick={() => setLightboxAberto(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxAberto(false)}
            aria-label="Fechar galeria"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
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
                className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 md:left-6"
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
                className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 md:right-6"
              >
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </>
          )}

          <div
            className="relative h-[80vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={ativa.url}
              alt={`${titulo} — foto ${indiceAtivo + 1} de ${total}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {total > 1 && (
            <span className="absolute bottom-6 rounded-pill bg-white/10 px-4 py-1.5 text-[12px] font-medium text-white">
              {indiceAtivo + 1} / {total}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
