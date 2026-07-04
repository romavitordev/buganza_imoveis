"use client";

import { useEffect } from "react";
import { enviarEvento } from "@/lib/track";

/**
 * Registra 1 visualização por imóvel POR DISPOSITIVO (localStorage —
 * persiste entre visitas). O servidor ainda aplica uma trava diária por
 * hash de IP+navegador, para não inflar mesmo em aba anônima.
 * Renderiza nada.
 */
export default function TrackView({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const chave = `bz-view-${slug}`;
      if (localStorage.getItem(chave)) return;
      localStorage.setItem(chave, String(Date.now()));
    } catch {
      // localStorage indisponível (modo privado etc.) — o servidor deduplica
    }
    enviarEvento(slug, "visualizacao");
  }, [slug]);

  return null;
}
