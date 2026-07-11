import { Quote } from "lucide-react";
import { DEPOIMENTOS } from "@/lib/depoimentos";

/** Prova social na home — cards estáticos, sem JavaScript. */
export default function Depoimentos() {
  return (
    <section
      id="depoimentos"
      className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24"
      aria-labelledby="depoimentos-titulo"
    >
      <div className="bz-fade-up mb-10">
        <p className="mb-2 flex items-center gap-2 text-[13px] text-black/55">
          <span className="bz-dot" aria-hidden="true" />
          Quem já fechou negócio
        </p>
        <h2
          id="depoimentos-titulo"
          className="text-3xl tracking-tight md:text-4xl"
        >
          Clientes que viraram amigos
        </h2>
      </div>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DEPOIMENTOS.map(({ nome, contexto, texto }) => (
          <li
            key={nome}
            className="group flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 transition-colors duration-300 hover:border-black/30"
          >
            <Quote
              size={22}
              strokeWidth={1.5}
              aria-hidden="true"
              className="rotate-180 text-black/20 transition-colors duration-300 group-hover:text-black"
            />
            <p className="flex-1 text-[14px] leading-relaxed text-black/70">
              {texto}
            </p>
            <div>
              <p className="text-sm font-semibold tracking-tight">{nome}</p>
              <p className="mt-0.5 text-[12px] text-black/45">{contexto}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
