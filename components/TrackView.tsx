"use client";

import { useEffect } from "react";
import { enviarEvento } from "@/lib/track";

/**
 * Registra 1 visualização por imóvel por sessão do navegador
 * (dedupe via sessionStorage). Renderiza nada.
 */
export default function TrackView({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const chave = `bz-view-${slug}`;
      if (sessionStorage.getItem(chave)) return;
      sessionStorage.setItem(chave, "1");
    } catch {
      // sessionStorage indisponível (modo privado etc.) — registra mesmo assim
    }
    enviarEvento(slug, "visualizacao");
  }, [slug]);

  return null;
}
