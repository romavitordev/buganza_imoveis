"use client";

import { FormEvent, useState } from "react";
import { Check, ChevronDown, Loader2, Send } from "lucide-react";

const inputCls =
  "rounded-xl border border-black/15 px-4 py-2.5 text-sm outline-none transition-colors focus:border-black";

/**
 * Formulário "Tenho interesse" — alternativa para quem não quer abrir o
 * WhatsApp na hora. Vive dentro do card de conversão do imóvel: começa
 * recolhido (um convite discreto) e expande ao clicar.
 */
export default function LeadForm({ slug }: { slug: string }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [mensagem, setMensagem] = useState("");
  // Honeypot anti-bot: escondido de humanos, bots preenchem
  const [site, setSite] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          whatsapp,
          mensagem,
          slug,
          site,
          origem:
            typeof document !== "undefined" && document.referrer
              ? new URL(document.referrer).hostname.slice(0, 60)
              : null,
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        erro?: string;
      } | null;
      if (!res.ok) {
        throw new Error(body?.erro ?? "Erro ao enviar. Tente novamente.");
      }
      setEnviado(true);
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : "Erro ao enviar. Tente novamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-mist px-5 py-6 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
          <Check size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium">Recebemos seu contato!</p>
          <p className="mt-1 text-[12px] leading-relaxed text-black/55">
            Vamos te chamar no WhatsApp em breve — normalmente respondemos
            no mesmo dia.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-controls="lead-form-campos"
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="block text-sm font-medium">
            Prefere que a gente te chame?
          </span>
          <span className="mt-0.5 block text-[12px] text-black/50">
            Deixe seu contato e retornamos sobre este imóvel.
          </span>
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-black/40 transition-transform duration-300 ${
            aberto ? "rotate-180" : ""
          }`}
        />
      </button>

      {aberto && (
        <form
          id="lead-form-campos"
          onSubmit={onSubmit}
          className="mt-4 flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-black/70">Nome</span>
            <input
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={inputCls}
              placeholder="Seu nome"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-black/70">
              WhatsApp (com DDD)
            </span>
            <input
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className={inputCls}
              placeholder="(15) 99999-9999"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-black/70">
              Mensagem (opcional)
            </span>
            <textarea
              rows={2}
              maxLength={500}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className={`${inputCls} resize-y`}
              placeholder="Ex.: posso visitar no sábado de manhã?"
            />
          </label>

          {/* Honeypot — escondido de pessoas, irresistível para bots */}
          <input
            type="text"
            name="site"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />

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
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-pill border border-black px-6 py-3 text-[13px] font-medium transition-colors hover:bg-black hover:text-white disabled:opacity-60"
          >
            {enviando ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={14} aria-hidden="true" />
            )}
            {enviando ? "Enviando…" : "Quero que me chamem"}
          </button>

          <p className="text-[11px] leading-relaxed text-black/40">
            Ao enviar, você concorda que usemos esses dados apenas para
            retornar seu contato sobre este imóvel.{" "}
            <a href="/privacidade" className="underline underline-offset-2">
              Política de privacidade
            </a>
            .
          </p>
        </form>
      )}
    </div>
  );
}
