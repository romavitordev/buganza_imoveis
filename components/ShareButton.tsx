"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

interface ShareButtonProps {
  titulo: string;
}

/**
 * Compartilhar o imóvel com cadeia de fallbacks:
 *  1. share nativo (mobile, contexto seguro)
 *  2. clipboard API
 *  3. execCommand("copy") — funciona em http:// e navegadores antigos
 */
export default function ShareButton({ titulo }: ShareButtonProps) {
  const [copiado, setCopiado] = useState(false);

  function marcarCopiado() {
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function copiarLegado(url: string): boolean {
    try {
      const area = document.createElement("textarea");
      area.value = url;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }

  async function compartilhar() {
    const url = window.location.href;

    // 1) share nativo (abre a folha de compartilhamento do celular)
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: titulo, url });
        return;
      } catch (e) {
        // usuário fechou a folha — não é erro
        if (e instanceof Error && e.name === "AbortError") return;
        // NotAllowedError/outros → tenta copiar
      }
    }

    // 2) clipboard API (exige contexto seguro)
    try {
      await navigator.clipboard.writeText(url);
      marcarCopiado();
      return;
    } catch {
      // indisponível (http:// ou permissão negada) → fallback legado
    }

    // 3) fallback legado
    if (copiarLegado(url)) {
      marcarCopiado();
    } else {
      // último recurso: mostra o link para copiar manualmente
      window.prompt("Copie o link do imóvel:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={compartilhar}
      className="inline-flex items-center gap-2 rounded-pill border border-black/15 px-4 py-2 text-[12px] font-medium text-black/70 transition-colors hover:border-black hover:text-black"
    >
      {copiado ? (
        <Check size={13} aria-hidden="true" />
      ) : (
        <Share2 size={13} aria-hidden="true" />
      )}
      {copiado ? "Link copiado!" : "Compartilhar"}
    </button>
  );
}
