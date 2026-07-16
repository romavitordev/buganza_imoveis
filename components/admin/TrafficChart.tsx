"use client";

/** Um dia da série de tráfego (30 dias). */
export interface DiaTrafego {
  /** ISO curto: "2026-07-10" */
  dia: string;
  visualizacoes: number;
  cliques: number;
}

function dataCurta(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

/**
 * Gráfico de barras minimalista (SVG puro, sem lib): visualizações em
 * cinza, cliques de WhatsApp em preto, um par por dia.
 */
export default function TrafficChart({ serie }: { serie: DiaTrafego[] }) {
  const total = serie.reduce(
    (soma, d) => soma + d.visualizacoes + d.cliques,
    0
  );

  if (serie.length === 0 || total === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-black/10 text-sm text-black/45">
        Sem acessos registrados nos últimos 30 dias.
      </div>
    );
  }

  const LARGURA = 640;
  const ALTURA = 140;
  const MARGEM = 4;
  const maximo = Math.max(
    ...serie.map((d) => Math.max(d.visualizacoes, d.cliques)),
    1
  );
  const slot = (LARGURA - MARGEM * 2) / serie.length;
  const larguraBarra = Math.max(2, slot * 0.32);

  const alturaDe = (valor: number) =>
    valor === 0 ? 0 : Math.max(2, (valor / maximo) * (ALTURA - 8));

  return (
    <figure className="rounded-2xl border border-black/10 p-5">
      <figcaption className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-black/45">
          Acessos por dia (30 dias)
        </span>
        <span className="flex items-center gap-4 text-[11px] text-black/55">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm bg-black/20"
              aria-hidden="true"
            />
            Visualizações
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm bg-black"
              aria-hidden="true"
            />
            Cliques WhatsApp
          </span>
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        className="w-full"
        role="img"
        aria-label={`Gráfico de acessos por dia: pico de ${maximo} no período`}
      >
        {serie.map((d, i) => {
          const x = MARGEM + i * slot;
          const hViews = alturaDe(d.visualizacoes);
          const hCliques = alturaDe(d.cliques);
          return (
            <g key={d.dia}>
              {/* String única (não interpolação em vários nós): <title>
                  colapsa o conteúdo num só text node, e vários nós quebram
                  a hidratação do React */}
              <title>{`${dataCurta(d.dia)}: ${d.visualizacoes} visualizações, ${d.cliques} cliques`}</title>
              <rect
                x={x}
                y={ALTURA - hViews}
                width={larguraBarra}
                height={hViews}
                rx={1.5}
                className="fill-black/20"
              />
              <rect
                x={x + larguraBarra + 1.5}
                y={ALTURA - hCliques}
                width={larguraBarra}
                height={hCliques}
                rx={1.5}
                className="fill-black"
              />
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex justify-between text-[10px] text-black/40">
        <span>{dataCurta(serie[0].dia)}</span>
        <span>{dataCurta(serie[serie.length - 1].dia)}</span>
      </div>
    </figure>
  );
}
