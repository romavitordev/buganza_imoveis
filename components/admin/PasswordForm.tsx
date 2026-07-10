"use client";

import { FormEvent, useState } from "react";
import { Check, KeyRound, Loader2 } from "lucide-react";

const inputCls =
  "rounded-xl border border-black/15 px-4 py-2.5 text-sm outline-none transition-colors focus:border-black";

export default function PasswordForm() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setOk(false);

    if (novaSenha !== confirmacao) {
      setErro("A confirmação não confere com a nova senha.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/admin/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      const body = (await res.json().catch(() => null)) as {
        erro?: string;
      } | null;
      if (!res.ok) {
        throw new Error(body?.erro ?? "Erro ao trocar a senha.");
      }
      setOk(true);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao trocar a senha.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-black/70">
          Senha atual
        </span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-black/70">
          Nova senha (mínimo 8 caracteres)
        </span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-black/70">
          Confirmar a nova senha
        </span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          className={inputCls}
        />
      </label>

      {erro && (
        <p
          role="alert"
          className="rounded-xl bg-black px-4 py-3 text-[13px] text-white"
        >
          {erro}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex items-center gap-2 rounded-pill bg-black px-6 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-60"
        >
          {enviando ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <KeyRound size={14} aria-hidden="true" />
          )}
          {enviando ? "Salvando…" : "Trocar senha"}
        </button>
        {ok && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-black/60">
            <Check size={15} aria-hidden="true" />
            Senha alterada
          </span>
        )}
      </div>
    </form>
  );
}
