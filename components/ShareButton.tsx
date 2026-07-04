"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

interface ShareButtonProps {
  titulo: string;
}

/** Compartilhar o imóvel: share nativo no mobile, copiar link no desktop. */
export default function ShareButton({ titulo }: ShareButtonProps) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // usuário cancelou o share nativo — nada a fazer
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
