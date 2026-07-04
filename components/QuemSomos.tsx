import { Handshake, KeyRound, MapPin, MessageCircle } from "lucide-react";
import { linkWhatsAppGeral } from "@/lib/whatsapp";

/**
 * Seção "Quem Somos" — informações fictícias por enquanto.
 * Este site é o ponto-chave do desenvolvimento da identidade visual
 * da Buganza: paleta preto/branco/cinza, headings leves, pills.
 */

const PILARES = [
  {
    icone: KeyRound,
    titulo: "Atendimento direto",
    texto:
      "Você fala com quem realmente conhece cada imóvel — sem intermediários, sem telefone que ninguém atende.",
  },
  {
    icone: Handshake,
    titulo: "Sem complicação",
    texto:
      "Da primeira visita à assinatura, cuidamos da burocracia para que comprar ou alugar seja simples de verdade.",
  },
  {
    icone: MapPin,
    titulo: "Sorocaba de ponta a ponta",
    texto:
      "Atuamos nos bairros residenciais e nos principais eixos comerciais da cidade e região.",
  },
];

export default function QuemSomos() {
  return (
    <section
      id="quem-somos"
      aria-labelledby="quem-somos-titulo"
      className="border-t border-black/8 bg-mist/50"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 py-16 md:grid-cols-[2fr_3fr] md:gap-16 md:px-8 md:py-24">
        <div className="bz-fade-up flex flex-col gap-5">
          <p className="flex items-center gap-2 text-[13px] text-black/55">
            <span className="bz-dot" aria-hidden="true" />
            Quem somos
          </p>
          <h2
            id="quem-somos-titulo"
            className="text-3xl leading-tight tracking-tight md:text-4xl"
          >
            Um casal de corretores.
            <br />
            Um jeito mais humano de negociar imóveis.
          </h2>
          <p className="text-[15px] leading-relaxed text-black/60">
            A Imóveis Buganza nasceu em Sorocaba da parceria de um casal que
            resolveu fazer diferente: menos vitrine, mais conversa. A gente
            acompanha cada cliente pessoalmente — do primeiro “oi” no WhatsApp
            até a entrega das chaves.
          </p>
          <p className="text-[15px] leading-relaxed text-black/60">
            Trabalhamos com um catálogo enxuto e escolhido a dedo, porque
            preferimos conhecer bem cada imóvel a anunciar qualquer um.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <a
              href={linkWhatsAppGeral()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-pill bg-black px-6 py-3 text-[13px] font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
            >
              <MessageCircle
                size={15}
                strokeWidth={2.5}
                className="text-[#25D366]"
                aria-hidden="true"
              />
              Conversar com a gente
            </a>
            <span className="text-[11px] text-black/45">CRECI 118400</span>
          </div>

          {/* Números — informações fictícias por enquanto */}
          <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-black/10 pt-6">
            {[
              { numero: "+120", rotulo: "imóveis negociados" },
              { numero: "+5", rotulo: "anos de mercado" },
              { numero: "100%", rotulo: "acompanhamento pessoal" },
            ].map(({ numero, rotulo }) => (
              <div key={rotulo}>
                <dt className="sr-only">{rotulo}</dt>
                <dd className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {numero}
                </dd>
                <dd className="mt-0.5 text-[11px] leading-snug text-black/50">
                  {rotulo}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-1 content-center gap-4 sm:grid-cols-1">
          {PILARES.map(({ icone: Icone, titulo, texto }, i) => (
            <div
              key={titulo}
              className="bz-fade-up group flex gap-4 rounded-2xl border border-black/8 bg-white p-6 transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-black/20 hover:shadow-[0_18px_44px_rgba(0,0,0,0.09)]"
              style={{ animationDelay: `${0.1 + i * 0.12}s` }}
            >
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-transparent bg-black text-white transition-all duration-300 ease-premium group-hover:scale-105 group-hover:border-black group-hover:bg-white group-hover:text-black">
                <Icone
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="transition-transform duration-300 ease-premium group-hover:-rotate-6"
                />
              </span>
              <div>
                <h3 className="mb-1 text-base font-medium tracking-tight">
                  {titulo}
                </h3>
                <p className="text-[13px] leading-relaxed text-black/55">
                  {texto}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
