"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MessageCircle, RotateCcw } from "lucide-react";
import { linkWhatsAppGeral } from "@/lib/whatsapp";

/**
 * Fronteira de erro global do site público. Captura falhas de runtime
 * (ex.: banco indisponível) e mostra uma página tratada com a marca,
 * em vez do erro cru do Next.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-[13px] font-medium uppercase tracking-wide text-black/40">
        Ops — algo saiu do lugar
      </p>
      <h1 className="max-w-xl text-3xl tracking-tight md:text-4xl">
        Tivemos um probleminha ao carregar esta página.
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-black/55">
        Já registramos o ocorrido. Você pode tentar de novo ou falar direto
        com a gente pelo WhatsApp.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-pill bg-black px-6 py-3 text-[13px] font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
        >
          <RotateCcw size={15} aria-hidden="true" />
          Tentar novamente
        </button>
        <a
          href={linkWhatsAppGeral()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-pill border border-black/35 px-6 py-3 text-[13px] font-medium transition-colors hover:border-black"
        >
          <MessageCircle size={15} strokeWidth={2.5} aria-hidden="true" />
          Falar no WhatsApp
        </a>
      </div>
      <Link
        href="/"
        className="text-[12px] text-black/45 underline underline-offset-4 transition-colors hover:text-black"
      >
        Voltar para o início
      </Link>
    </main>
  );
}
