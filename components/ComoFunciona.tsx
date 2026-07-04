import {
  MessageCircle,
  CalendarCheck,
  Handshake,
  KeyRound,
} from "lucide-react";

/**
 * Passo a passo da jornada do cliente — padrão consolidado em sites
 * imobiliários, reforçando a proposta "sem complicação".
 */

const PASSOS = [
  {
    numero: "01",
    icone: MessageCircle,
    titulo: "Chame no WhatsApp",
    texto:
      "Conte o que você procura (ou o imóvel que quer anunciar). Respondemos rápido, sem formulário nem espera.",
  },
  {
    numero: "02",
    icone: CalendarCheck,
    titulo: "Visita acompanhada",
    texto:
      "Agendamos no seu horário e vamos juntos: você conhece o imóvel com quem realmente entende dele.",
  },
  {
    numero: "03",
    icone: Handshake,
    titulo: "Negociação transparente",
    texto:
      "Proposta, contraproposta e condições explicadas com clareza — você decide com segurança.",
  },
  {
    numero: "04",
    icone: KeyRound,
    titulo: "Documentação e chaves",
    texto:
      "Cuidamos de toda a burocracia com o cartório e o banco até a entrega das chaves.",
  },
];

export default function ComoFunciona() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-titulo"
      className="border-t border-black/8"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="bz-fade-up mb-12">
          <p className="mb-2 flex items-center gap-2 text-[13px] text-black/55">
            <span className="bz-dot" aria-hidden="true" />
            Simples assim
          </p>
          <h2
            id="como-funciona-titulo"
            className="text-3xl tracking-tight md:text-4xl"
          >
            Como funciona
          </h2>
        </div>

        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map(({ numero, icone: Icone, titulo, texto }, i) => (
            <li
              key={numero}
              className="bz-fade-up group relative flex flex-col gap-4 rounded-2xl border border-black/8 p-6 transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-black/20 hover:shadow-[0_18px_44px_rgba(0,0,0,0.09)]"
              style={{ animationDelay: `${0.08 + i * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-transparent bg-black text-white transition-all duration-300 ease-premium group-hover:scale-105 group-hover:border-black group-hover:bg-white group-hover:text-black">
                  <Icone size={18} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span
                  aria-hidden="true"
                  className="text-3xl font-light tracking-tight text-black/15 transition-colors duration-300 group-hover:text-black/35"
                >
                  {numero}
                </span>
              </div>
              <div>
                <h3 className="mb-1 text-base font-medium tracking-tight">
                  {titulo}
                </h3>
                <p className="text-[13px] leading-relaxed text-black/55">
                  {texto}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
