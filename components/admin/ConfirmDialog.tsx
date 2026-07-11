"use client";

import { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";

interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  rotuloConfirmar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Modal de confirmação no padrão da marca — substitui o window.confirm
 * cru nas ações destrutivas do admin. Foco começa no "Cancelar" (a ação
 * segura), Escape fecha.
 */
export default function ConfirmDialog({
  aberto,
  titulo,
  descricao,
  rotuloConfirmar = "Excluir",
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;
    cancelarRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancelar();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [aberto, onCancelar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-titulo"
      onClick={onCancelar}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_16px_56px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-mist text-black/70">
          <TriangleAlert size={20} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h2 id="confirm-titulo" className="text-lg tracking-tight">
          {titulo}
        </h2>
        {descricao && (
          <p className="mt-1.5 text-[13px] leading-relaxed text-black/55">
            {descricao}
          </p>
        )}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            ref={cancelarRef}
            type="button"
            onClick={onCancelar}
            className="rounded-pill border border-black/15 px-5 py-2.5 text-[13px] font-medium text-black/70 transition-colors hover:border-black"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="rounded-pill bg-black px-5 py-2.5 text-[13px] font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
          >
            {rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
