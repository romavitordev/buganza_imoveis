"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import {
  alternarFavorito,
  ehFavorito,
  EVENTO_FAVORITOS,
} from "@/lib/favoritos";

interface FavoriteButtonProps {
  id: string;
  titulo: string;
}

/**
 * Coração de favoritar no card do imóvel. Começa "apagado" no servidor e
 * sincroniza com o localStorage após a hidratação (evita mismatch de SSR).
 */
export default function FavoriteButton({ id, titulo }: FavoriteButtonProps) {
  const [favorito, setFavorito] = useState(false);

  useEffect(() => {
    const sincronizar = () => setFavorito(ehFavorito(id));
    sincronizar();
    window.addEventListener(EVENTO_FAVORITOS, sincronizar);
    // "storage" cobre mudanças feitas em outra aba
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener(EVENTO_FAVORITOS, sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, [id]);

  return (
    <button
      type="button"
      onClick={() => setFavorito(alternarFavorito(id))}
      aria-pressed={favorito}
      aria-label={
        favorito
          ? `Remover ${titulo} dos favoritos`
          : `Salvar ${titulo} nos favoritos`
      }
      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-[0_2px_12px_rgba(0,0,0,0.14)] backdrop-blur transition-all duration-200 ease-premium hover:scale-110 active:scale-95"
    >
      <Heart
        size={15}
        strokeWidth={2}
        aria-hidden="true"
        className={`transition-colors duration-200 ${
          favorito ? "fill-black text-black" : "text-black/45"
        }`}
      />
    </button>
  );
}
