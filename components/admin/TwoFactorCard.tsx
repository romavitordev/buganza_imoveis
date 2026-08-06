"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
/* eslint-disable @next/next/no-img-element -- o QR é um data URL gerado
   no servidor; next/image não otimiza data URLs. */
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";

/**
 * Ativação/desativação da verificação em duas etapas (TOTP) na página
 * "Minha conta". Fluxo de ativar: gerar QR → escanear no app → confirmar
 * o primeiro código. Desativar exige um código válido.
 */
export default function TwoFactorCard({ ativado }: { ativado: boolean }) {
  const router = useRouter();
  const [qr, setQr] = useState<string | null>(null);
  const [segredo, setSegredo] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function chamar(acao: string, comCodigo = false) {
    setErro(null);
    setAviso(null);
    setOcupado(true);
    try {
      const res = await fetch("/api/admin/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          comCodigo ? { acao, codigo } : { acao }
        ),
      });
      const body = (await res.json().catch(() => null)) as {
        erro?: string;
        qr?: string;
        segredo?: string;
      } | null;
      if (!res.ok) throw new Error(body?.erro ?? "Erro. Tente novamente.");
      return body;
    } finally {
      setOcupado(false);
    }
  }

  async function iniciar() {
    try {
      const body = await chamar("iniciar");
      setQr(body?.qr ?? null);
      setSegredo(body?.segredo ?? null);
      setCodigo("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao iniciar.");
    }
  }

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    try {
      await chamar("confirmar", true);
      setQr(null);
      setSegredo(null);
      setCodigo("");
      setAviso("Verificação em duas etapas ativada! ✅");
      router.refresh();
    } catch (e2) {
      setErro(e2 instanceof Error ? e2.message : "Código inválido.");
    }
  }

  async function desativar(e: FormEvent) {
    e.preventDefault();
    try {
      await chamar("desativar", true);
      setCodigo("");
      setAviso("Verificação em duas etapas desativada.");
      router.refresh();
    } catch (e2) {
      setErro(e2 instanceof Error ? e2.message : "Código inválido.");
    }
  }

  const inputCodigo = (
    <input
      required
      inputMode="numeric"
      pattern="[0-9]{6}"
      maxLength={6}
      value={codigo}
      onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
      placeholder="000000"
      aria-label="Código de 6 dígitos do app autenticador"
      className="w-32 rounded-xl border border-black/15 px-4 py-2.5 text-center text-sm tracking-[0.3em] outline-none transition-colors focus:border-black"
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-sm">
        {ativado ? (
          <>
            <ShieldCheck size={16} className="text-[#1f7a44]" aria-hidden="true" />
            <span className="font-medium">Ativa</span> — o login exige senha
            + código do app.
          </>
        ) : (
          <>
            <ShieldOff size={16} className="text-black/40" aria-hidden="true" />
            Desativada — o login exige só a senha.
          </>
        )}
      </p>

      {erro && (
        <p role="alert" className="rounded-xl bg-black px-4 py-3 text-[13px] text-white">
          {erro}
        </p>
      )}
      {aviso && (
        <p className="rounded-xl bg-mist px-4 py-3 text-[13px] font-medium">
          {aviso}
        </p>
      )}

      {!ativado && !qr && (
        <button
          type="button"
          onClick={iniciar}
          disabled={ocupado}
          className="inline-flex w-fit items-center gap-2 rounded-pill bg-black px-5 py-2.5 text-[13px] font-medium text-white transition-opacity disabled:opacity-60"
        >
          {ocupado && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
          Ativar verificação em duas etapas
        </button>
      )}

      {!ativado && qr && (
        <form onSubmit={confirmar} className="flex flex-col gap-3">
          <ol className="list-decimal pl-5 text-[13px] leading-relaxed text-secundario">
            <li>
              Abra o app autenticador (Google Authenticator, Authy,
              1Password…) e escaneie o QR abaixo.
            </li>
            <li>Digite o código de 6 dígitos que o app mostrar.</li>
          </ol>
          <img
            src={qr}
            alt="QR code para configurar o app autenticador"
            width={220}
            height={220}
            className="rounded-xl border border-black/10"
          />
          {segredo && (
            <p className="text-[12px] md:text-[11px] text-secundario">
              Sem câmera? Digite o código manualmente no app:{" "}
              <code className="rounded bg-mist px-1.5 py-0.5">{segredo}</code>
            </p>
          )}
          <div className="flex items-center gap-2">
            {inputCodigo}
            <button
              type="submit"
              disabled={ocupado || codigo.length !== 6}
              className="inline-flex items-center gap-2 rounded-pill bg-black px-5 py-2.5 text-[13px] font-medium text-white transition-opacity disabled:opacity-60"
            >
              {ocupado && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
              Confirmar e ativar
            </button>
          </div>
        </form>
      )}

      {ativado && (
        <form onSubmit={desativar} className="flex flex-col gap-2">
          <p className="text-[12px] text-secundario">
            Para desativar, confirme um código atual do app:
          </p>
          <div className="flex items-center gap-2">
            {inputCodigo}
            <button
              type="submit"
              disabled={ocupado || codigo.length !== 6}
              className="inline-flex items-center gap-2 rounded-pill border border-black/20 px-5 py-2.5 text-[13px] font-medium transition-colors hover:border-black disabled:opacity-60"
            >
              {ocupado && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
              Desativar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
