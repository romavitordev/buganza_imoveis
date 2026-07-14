"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Check, Loader2, MessageCircle, Send, X } from "lucide-react";
import { BrandMark } from "@/components/SiteNav";
import { TOPICOS, responder, respostaDoTopico } from "@/lib/chatbot";
import { linkWhatsAppGeral, linkWhatsAppImovel } from "@/lib/whatsapp";

/**
 * "Buganza Suporte" — widget de atendimento flutuante, fechado por padrão
 * no canto inferior direito, presente em todas as páginas. Responde a
 * dúvidas frequentes por regras (lib/chatbot.ts); quando não sabe, oferece
 * o WhatsApp. Também captura leads (nome + WhatsApp) → /api/leads, ligando
 * ao imóvel quando a conversa acontece numa página de detalhe.
 */

interface Bolha {
  de: "bot" | "user";
  texto: ReactNode;
}

const SAUDACAO =
  "Olá! Sou o assistente da Imóveis Buganza 👋 Como posso ajudar? Escolha um assunto abaixo ou escreva sua dúvida.";

export default function ChatWidget() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Bolha[]>([
    { de: "bot", texto: SAUDACAO },
  ]);
  const [entrada, setEntrada] = useState("");
  // Modo "deixar contato": troca o input livre pelo mini-formulário de lead
  const [modoContato, setModoContato] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const fimRef = useRef<HTMLDivElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  // slug do imóvel quando a conversa acontece numa página de detalhe
  const slugImovel = pathname?.startsWith("/imoveis/")
    ? pathname.split("/")[2] || undefined
    : undefined;
  const hrefWhats = slugImovel
    ? linkWhatsAppImovel(slugImovel)
    : linkWhatsAppGeral();

  // Rola para a última mensagem a cada atualização
  useEffect(() => {
    if (aberto) fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, aberto, modoContato]);

  // Esc fecha o painel
  useEffect(() => {
    if (!aberto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aberto]);

  function empurrar(bolha: Bolha) {
    setMensagens((atual) => [...atual, bolha]);
  }

  /** Bloco de ações que sempre acompanha uma resposta do bot. */
  function acoesBot(): ReactNode {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <a
          href={hrefWhats}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-pill bg-black px-4 py-2.5 text-[12px] font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
        >
          <MessageCircle
            size={13}
            strokeWidth={2.5}
            className="text-[#25D366]"
            aria-hidden="true"
          />
          Falar no WhatsApp
        </a>
        <button
          type="button"
          onClick={iniciarContato}
          className="rounded-pill border border-black/15 px-4 py-2.5 text-[12px] font-medium text-black/70 transition-colors hover:border-black"
        >
          Deixar meu contato
        </button>
      </div>
    );
  }

  function responderTexto(texto: string, resposta: ReturnType<typeof responder>) {
    empurrar({ de: "user", texto });
    empurrar({
      de: "bot",
      texto: (
        <>
          {resposta.texto}
          {acoesBot()}
        </>
      ),
    });
  }

  function onChip(id: string) {
    const topico = TOPICOS.find((t) => t.id === id);
    if (!topico) return;
    responderTexto(topico.titulo, respostaDoTopico(id));
  }

  function onEnviarTexto(e: FormEvent) {
    e.preventDefault();
    const texto = entrada.trim();
    if (!texto) return;
    setEntrada("");
    responderTexto(texto, responder(texto));
  }

  function iniciarContato() {
    setModoContato(true);
    empurrar({
      de: "bot",
      texto:
        "Perfeito! Deixe seu nome e WhatsApp que um corretor retorna — normalmente no mesmo dia.",
    });
  }

  return (
    <>
      {/* Botão flutuante — fica acima da bottom nav no mobile */}
      {!aberto && (
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir atendimento Buganza Suporte"
          className="fixed right-4 bottom-[5.5rem] z-[70] inline-flex items-center gap-2 rounded-pill bg-black px-5 py-3.5 text-[13px] font-medium text-white shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-premium hover:-translate-y-0.5 md:bottom-6"
        >
          <MessageCircle size={18} strokeWidth={2} aria-hidden="true" />
          Suporte
        </button>
      )}

      {/* Painel do chat */}
      {aberto && (
        <div
          ref={painelRef}
          role="dialog"
          aria-label="Buganza Suporte"
          className="fixed inset-x-4 bottom-4 z-[70] flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_16px_56px_rgba(0,0,0,0.24)] md:inset-x-auto md:right-6 md:bottom-6 md:h-[560px] md:max-h-[80vh] md:w-[380px]"
        >
          {/* Cabeçalho */}
          <header className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mist">
                <BrandMark />
              </span>
              <div>
                <p className="text-sm font-semibold tracking-tight">
                  Buganza Suporte
                </p>
                <p className="flex items-center gap-1.5 text-[11px] text-black/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" />
                  Online agora
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar atendimento"
              className="rounded-full p-1.5 text-black/50 transition-colors hover:bg-mist hover:text-black"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          {/* Conversa */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {mensagens.map((m, i) => (
              <div
                key={i}
                className={m.de === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    m.de === "user"
                      ? "bg-black text-white"
                      : "bg-mist text-black/80"
                  }`}
                >
                  {m.texto}
                </div>
              </div>
            ))}

            {/* Chips de assunto — só enquanto ninguém digitou ainda */}
            {mensagens.length === 1 && !modoContato && (
              <div className="flex flex-wrap gap-2 pt-1">
                {TOPICOS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onChip(t.id)}
                    className="rounded-pill border border-black/15 bg-white px-3 py-1.5 text-[12px] font-medium text-black/70 transition-colors hover:border-black hover:text-black"
                  >
                    {t.titulo}
                  </button>
                ))}
              </div>
            )}

            {modoContato && !enviado && (
              <ContatoForm
                slug={slugImovel}
                onEnviado={() => {
                  setEnviado(true);
                  empurrar({
                    de: "bot",
                    texto:
                      "Recebemos seu contato! Um corretor vai te chamar no WhatsApp em breve. 🙌",
                  });
                  setModoContato(false);
                }}
              />
            )}

            <div ref={fimRef} />
          </div>

          {/* Entrada de texto — escondida durante o formulário de contato */}
          {!modoContato && (
            <form
              onSubmit={onEnviarTexto}
              className="flex items-center gap-2 border-t border-black/10 p-3"
            >
              <input
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                placeholder="Escreva sua dúvida…"
                aria-label="Sua mensagem"
                className="flex-1 rounded-pill border border-black/15 px-4 py-2.5 text-sm outline-none transition-colors focus:border-black"
              />
              <button
                type="submit"
                aria-label="Enviar"
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-black text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
              >
                <Send size={15} aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}

/** Mini-formulário de captura de lead dentro do chat. */
function ContatoForm({
  slug,
  onEnviado,
}: {
  slug?: string;
  onEnviado: () => void;
}) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [site, setSite] = useState(""); // honeypot
  const [enviando, setEnviando] = useState(false);
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
          mensagem: "Contato pelo chat do site (Buganza Suporte).",
          slug,
          site,
          origem: "chat",
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        erro?: string;
      } | null;
      if (!res.ok) throw new Error(body?.erro ?? "Erro ao enviar.");
      onEnviado();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-3"
    >
      <input
        required
        minLength={2}
        maxLength={80}
        autoComplete="name"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Seu nome"
        aria-label="Seu nome"
        className="rounded-xl border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-black"
      />
      <input
        required
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        placeholder="WhatsApp com DDD"
        aria-label="Seu WhatsApp"
        className="rounded-xl border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-black"
      />
      {/* Honeypot anti-bot */}
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
        <p role="alert" className="text-[12px] font-medium text-black">
          {erro}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex items-center justify-center gap-2 rounded-pill bg-black px-4 py-2.5 text-[12px] font-medium text-white transition-opacity disabled:opacity-60"
      >
        {enviando ? (
          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
        ) : (
          <Check size={13} aria-hidden="true" />
        )}
        {enviando ? "Enviando…" : "Enviar contato"}
      </button>
      <p className="text-[10px] leading-relaxed text-black/40">
        Ao enviar, você concorda com nossa{" "}
        <a href="/privacidade" className="underline underline-offset-2">
          política de privacidade
        </a>
        .
      </p>
    </form>
  );
}
