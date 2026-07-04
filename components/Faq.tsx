import { Plus } from "lucide-react";
import { linkWhatsAppGeral } from "@/lib/whatsapp";

/** Dúvidas mais comuns de quem compra, aluga ou anuncia um imóvel. */

const PERGUNTAS = [
  {
    pergunta: "Quanto custa anunciar meu imóvel com a Buganza?",
    resposta:
      "Nada. Você só paga a comissão de corretagem quando o negócio é concluído — sem taxa de anúncio, sem mensalidade e sem exclusividade forçada.",
  },
  {
    pergunta: "Como agendo uma visita?",
    resposta:
      "Pelo WhatsApp mesmo: você escolhe o imóvel, a gente combina o melhor dia e horário e vamos juntos até lá. Fazemos visitas também aos sábados.",
  },
  {
    pergunta: "Vocês ajudam com o financiamento?",
    resposta:
      "Sim. Fazemos a simulação nos principais bancos, orientamos sobre o uso do FGTS e acompanhamos o processo do começo ao fim, sem custo adicional.",
  },
  {
    pergunta: "Quais documentos preciso para alugar?",
    resposta:
      "Em geral: documento com foto, comprovante de renda e de residência. Dependendo do caso, fiador, seguro-fiança ou caução — explicamos as opções e ajudamos a escolher a mais simples para você.",
  },
  {
    pergunta: "Em quais cidades vocês atuam?",
    resposta:
      "Sorocaba e região (Votorantim, Araçoiaba da Serra, Itu e arredores). Se o imóvel que você procura estiver fora dessa área, indicamos parceiros de confiança.",
  },
];

export default function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-titulo"
      className="border-t border-black/8 bg-mist/50"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 md:grid-cols-[2fr_3fr] md:gap-16 md:px-8 md:py-24">
        <div className="bz-fade-up">
          <p className="mb-2 flex items-center gap-2 text-[13px] text-black/55">
            <span className="bz-dot" aria-hidden="true" />
            Perguntas frequentes
          </p>
          <h2
            id="faq-titulo"
            className="text-3xl leading-tight tracking-tight md:text-4xl"
          >
            Tudo o que você precisa saber antes de decidir.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-black/60">
            Não achou sua dúvida aqui? Manda no WhatsApp — a gente responde
            de verdade, sem robô.
          </p>
          <a
            href={linkWhatsAppGeral()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-pill border border-black/30 px-6 py-3 text-[13px] font-medium transition-colors hover:border-black"
          >
            Perguntar no WhatsApp
          </a>
        </div>

        <div className="flex flex-col gap-3">
          {PERGUNTAS.map(({ pergunta, resposta }, i) => (
            <details
              key={pergunta}
              className="bz-fade-up group rounded-2xl border border-black/8 bg-white px-5 transition-colors open:border-black/20 hover:border-black/20"
              style={{ animationDelay: `${0.06 + i * 0.08}s` }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[14px] font-medium tracking-tight [&::-webkit-details-marker]:hidden">
                {pergunta}
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-mist text-black transition-transform duration-300 ease-premium group-open:rotate-45"
                >
                  <Plus size={14} strokeWidth={2.5} />
                </span>
              </summary>
              <p className="pb-5 text-[13px] leading-relaxed text-black/60">
                {resposta}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
