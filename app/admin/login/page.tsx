"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { BrandMark } from "@/components/SiteNav";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const destino = searchParams.get("de") ?? "/admin";
        router.push(destino.startsWith("/admin") ? destino : "/admin");
        router.refresh();
        return;
      }

      const body = (await res.json().catch(() => null)) as {
        erro?: string;
      } | null;
      setErro(body?.erro ?? "Não foi possível entrar. Tente novamente.");
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-mist px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Painel Buganza
            </h1>
            <p className="mt-1 text-[13px] text-black/50">
              Acesso restrito aos corretores
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-black/70">
              E-mail
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-black/15 px-4 py-3 text-sm outline-none transition-colors focus:border-black"
              placeholder="voce@exemplo.com"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-black/70">
              Senha
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-black/15 px-4 py-3 text-sm outline-none transition-colors focus:border-black"
              placeholder="••••••••"
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

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-pill bg-black px-6 py-3.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
          >
            {enviando ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <Lock size={14} aria-hidden="true" />
            )}
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
