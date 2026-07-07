"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

/** Fronteira de erro do painel admin — mantém o tom sóbrio do painel. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error boundary]", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="text-2xl tracking-tight">Erro ao carregar o painel</h1>
      <p className="max-w-md text-sm text-black/55">
        Não foi possível concluir a operação. Verifique a conexão e tente
        novamente.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-pill bg-black px-6 py-3 text-[13px] font-medium text-white"
      >
        <RotateCcw size={15} aria-hidden="true" />
        Tentar novamente
      </button>
    </main>
  );
}
