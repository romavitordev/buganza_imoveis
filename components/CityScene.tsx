"use client";

import { useEffect, useRef } from "react";

/**
 * Cena SVG do hero — torres minimalistas sobre o céu.
 *
 * DUAS MONTAGENS, uma para cada largura de tela:
 *  - "amplo" (desktop): a cidade inteira, sete silhuetas e três torres.
 *  - "compacto" (mobile): SÓ a torre principal e o astro. A cidade
 *    inteira espremida em 375px virava um amontoado de retângulos
 *    pequenos demais para se ler como cidade, e ainda disputava atenção
 *    com o título e os botões, que são o que importa na primeira dobra.
 *
 * As duas são o MESMO desenho — muda o recorte (viewBox) e o que entra
 * nele. Vivem as duas no DOM e o CSS escolhe: trocar o viewBox por
 * JavaScript faria a cena saltar depois da hidratação, justamente
 * durante a animação de entrada do hero.
 *
 * Efeito de scroll (reversível, ligado ao progresso do scroll):
 *  - saindo do hero: silhuetas de fundo somem descendo, torres descem;
 *  - voltando ao topo: tudo sobe e reaparece.
 * Respeita prefers-reduced-motion.
 */

interface WindowGridProps {
  x: number;
  y: number;
  cols: number;
  rows: number;
  w: number;
  h: number;
  gx: number;
  gy: number;
  lit: number[];
  /** Prefixo da key — as duas montagens coexistem no DOM. */
  id: string;
}

function WindowGrid({
  x,
  y,
  cols,
  rows,
  w,
  h,
  gx,
  gy,
  lit,
  id,
}: WindowGridProps) {
  const litSet = new Set(lit);
  const windows = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const isLit = litSet.has(idx);
      windows.push(
        <rect
          key={`${id}-${idx}`}
          x={x + c * (w + gx)}
          y={y + r * (h + gy)}
          width={w}
          height={h}
          fill={isLit ? "#E0C27E" : "var(--janela-apagada)"}
          className={isLit ? "bz-lit" : undefined}
          // Delay determinístico (evita mismatch de hidratação) mas
          // visualmente alternado, como o Math.random() da versão original
          style={
            isLit
              ? { animationDelay: `${((idx * 137) % 260) / 100}s` }
              : undefined
          }
        />
      );
    }
  }

  return <g>{windows}</g>;
}

/**
 * Céu estrelado do modo escuro.
 *
 * FORA do grupo da lua, de propósito. Enquanto viviam dentro dele, as
 * estrelas viajavam junto no arco da troca de tema — o céu inteiro
 * deslizava com o astro, o que denuncia o truque. Agora a lua chega
 * sozinha e só depois elas acendem (o atraso está em globals.css, na
 * transição de .bz-estrelas).
 *
 * Cada cena tem o seu campo: o recorte do mobile é estreito e uma
 * estrela posicionada para o desktop simplesmente cairia fora dele.
 */
function Estrelas({ pontos }: { pontos: [number, number, number][] }) {
  return (
    <g className="bz-estrelas" fill="#E0C27E">
      {pontos.map(([cx, cy, r], i) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={r}
          className="bz-estrela"
          // Cada uma no seu tempo. O atraso é determinístico (nada de
          // Math.random, que quebraria a hidratação) mas com passo primo,
          // então nunca cai em fase: o céu nunca pisca todo junto.
          style={{ animationDelay: `${((i * 1373) % 5200) / 1000}s` }}
        />
      ))}
    </g>
  );
}

/**
 * Nuvens do modo claro.
 *
 * São o contrapeso das estrelas: o céu da noite ganhou textura e o do
 * dia tinha só o sol num vazio. Feitas de três círculos sobrepostos —
 * a forma mais simples que ainda lê como nuvem — e num tom entre o céu
 * e as silhuetas de fundo, senão branco sobre branco some.
 *
 * Andam com `transform`, que o navegador resolve na composição, e bem
 * devagar: 150, 190 e 230 segundos para atravessar o quadro. Precisa
 * ser lento a ponto de o visitante não "ver" o movimento, só sentir que
 * a cena está viva. Ao sair pela direita, o laço traz cada uma de volta
 * pela esquerda.
 */
function Nuvem({
  y,
  escala = 1,
  className,
}: {
  y: number;
  escala?: number;
  className: string;
}) {
  return (
    /* DOIS grupos, e não um, e nesta ordem.
     *
     * O de FORA anda, em coordenadas cruas do viewBox. O de DENTRO
     * cuida da altura e do tamanho. Se fosse ao contrário — a escala
     * por fora —, cada nuvem percorreria uma distância diferente, já
     * que o translate herdaria o scale do pai.
     *
     * Não existe mais um `x` inicial: se existisse, a nuvem voltaria
     * do laço para a posição dela em vez de vir da esquerda. Onde cada
     * uma começa é escolhido pelo animation-delay negativo, no CSS.
     */
    <g className={`bz-nuvem ${className}`}>
      <g transform={`translate(0 ${y}) scale(${escala})`} fill="var(--nuvem)">
        <ellipse cx="0" cy="0" rx="54" ry="20" />
        <ellipse cx="-34" cy="6" rx="34" ry="14" />
        <ellipse cx="30" cy="7" rx="30" ry="13" />
      </g>
    </g>
  );
}

/**
 * Campo do desktop: espalhado pelo céu todo e LONGE da lua (que fica em
 * 920,150). Amontoadas em volta dela, viravam um brilho só.
 */
const ESTRELAS_AMPLO: [number, number, number][] = [
  [140, 96, 2.2],
  [268, 176, 1.7],
  [352, 62, 2.6],
  [196, 292, 1.9],
  [430, 250, 1.6],
  [318, 372, 2],
  [592, 54, 2.1],
  [706, 268, 1.8],
  [806, 70, 2.4],
  [752, 186, 2],
  [878, 336, 1.7],
  [1016, 252, 2.6],
  [1060, 86, 3],
  [1112, 188, 2.2],
  [1150, 330, 1.9],
  [980, 42, 2.3],
];

/** Campo do mobile: só o que cabe no recorte 440–800, fora da torre. */
const ESTRELAS_COMPACTO: [number, number, number][] = [
  [470, 120, 2.2],
  [452, 250, 1.8],
  [700, 96, 2],
  [772, 300, 2.2],
  [618, 74, 1.8],
  [790, 190, 1.6],
  [684, 372, 1.9],
];

/** O astro: sol de dia, lua crescente de noite. */
function Astro({ id }: { id: string }) {
  const mascara = `bzLua-${id}`;
  return (
    /* Os dois ficam no SVG e quem escolhe é o CSS (.bz-sol / .bz-lua, em
       globals.css, sob [data-theme]). Assim não existe estado de tema
       dentro do React e nada pisca entre o HTML do servidor e a
       hidratação — o problema clássico de "ler o tema" no componente. */
    <g className="bz-layer-sun">
      <g className="bz-sol">
        <circle cx="920" cy="150" r="70" fill="#ffffff" opacity="0.9" />
        {/* Aro dourado: o sol era branco sobre um céu quase branco e
            praticamente sumia. O aro dá a borda e leva a cor da marca
            para o ponto mais alto da cena. */}
        <circle
          cx="920"
          cy="150"
          r="70"
          fill="none"
          stroke="#C6A052"
          strokeWidth="1.5"
          opacity="0.7"
        />
      </g>

      {/* A crescente é UM disco com outro recortado fora do centro
          (máscara), e não duas luas sobrepostas: assim a borda interna
          fica limpa sobre qualquer céu, sem emenda visível. */}
      <g className="bz-lua">
        <mask id={mascara}>
          <rect x="790" y="20" width="260" height="260" fill="black" />
          <circle cx="920" cy="150" r="70" fill="white" />
          <circle cx="884" cy="126" r="62" fill="black" />
        </mask>
        <circle
          cx="920"
          cy="150"
          r="70"
          fill="#E0C27E"
          mask={`url(#${mascara})`}
        />
      </g>
    </g>
  );
}

/** A torre principal, a única que sobrevive no recorte do mobile. */
function TorrePrincipal({ id }: { id: string }) {
  return (
    <g>
      <rect
        x="480"
        y="140"
        width="180"
        height="560"
        fill={`url(#bzTower-${id})`}
      />
      <rect x="480" y="128" width="180" height="12" fill="var(--predio-topo)" />
      <rect x="550" y="96" width="6" height="32" fill="var(--predio-topo)" />
      <WindowGrid
        id={id}
        x={500}
        y={170}
        cols={5}
        rows={16}
        w={22}
        h={18}
        gx={12}
        gy={14}
        lit={[3, 7, 12, 21, 26, 34, 43, 48, 57, 62, 71]}
      />
    </g>
  );
}

export default function CityScene() {
  const raizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raiz = raizRef.current;
    if (!raiz) return;

    const reduzMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduzMovimento) return;

    let raf = 0;

    function aplicar() {
      raf = 0;
      const el = raizRef.current;
      if (!el) return;
      // Progresso 0 → 1 ao longo de ~70% da altura da viewport
      const progresso = Math.min(
        Math.max(window.scrollY / (window.innerHeight * 0.7), 0),
        1
      );
      // No elemento que ENVOLVE as duas montagens: assim a variável é
      // herdada pelas duas e o efeito não depende de qual está visível.
      el.style.setProperty("--bz-p", progresso.toFixed(4));
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(aplicar);
    }

    aplicar();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={raizRef} className="bz-cena-raiz">
      {/* ---------- desktop: a cidade inteira ---------- */}
      <svg
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMax meet"
        className="bz-scene bz-scene-amplo"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bzTower-amplo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--predio-a)" />
            <stop offset="100%" stopColor="var(--predio-c)" />
          </linearGradient>
        </defs>

        {/* O céu é o degradê do wrapper (.bz-media-wrap) — o SVG fica
            transparente para não criar emenda em telas de qualquer proporção */}

        <Estrelas pontos={ESTRELAS_AMPLO} />
        <Astro id="amplo" />
        {/* Nuvens DEPOIS do astro e ANTES dos prédios: é essa fatia da
            ordem do SVG que as faz passar na frente do sol e atrás da
            cidade. Alturas, tamanhos e velocidades diferentes — duas no
            mesmo ritmo entregam que é um laço. */}
        <Nuvem y={120} escala={1} className="bz-nuvem-a" />
        <Nuvem y={230} escala={0.72} className="bz-nuvem-b" />
        <Nuvem y={90} escala={0.85} className="bz-nuvem-c" />

        {/* Silhuetas de fundo — somem descendo ao scrollar */}
        <g className="bz-layer-bg">
          <g fill="var(--predio-longe-a)">
            <rect x="60" y="300" width="120" height="400" />
            <rect x="330" y="260" width="90" height="440" />
            <rect x="760" y="320" width="110" height="380" />
            <rect x="1050" y="280" width="100" height="420" />
          </g>
          <g fill="var(--predio-longe-b)">
            <rect x="150" y="340" width="100" height="360" />
            <rect x="700" y="380" width="80" height="320" />
            <rect x="960" y="360" width="120" height="340" />
          </g>
        </g>

        {/* Torres principais — descem e desaparecem ao scrollar */}
        <g className="bz-layer-main">
          <TorrePrincipal id="amplo" />

          {/* Torre secundária — esquerda */}
          <g>
            <rect
              x="230"
              y="240"
              width="130"
              height="460"
              fill="var(--predio-b)"
            />
            <rect
              x="230"
              y="230"
              width="130"
              height="10"
              fill="var(--predio-topo)"
            />
            <WindowGrid
              id="amplo-b"
              x={246}
              y={264}
              cols={4}
              rows={13}
              w={20}
              h={16}
              gx={10}
              gy={16}
              lit={[2, 9, 14, 23, 30, 37, 44]}
            />
          </g>

          {/* Torre baixa comercial — direita */}
          <g>
            <rect
              x="820"
              y="440"
              width="220"
              height="260"
              fill="var(--predio-c)"
            />
            <WindowGrid
              id="amplo-c"
              x={838}
              y={464}
              cols={7}
              rows={6}
              w={22}
              h={20}
              gx={6}
              gy={16}
              lit={[4, 11, 18, 27, 33]}
            />
          </g>
        </g>

        {/* Linha do chão */}
        <rect
          x="0"
          y="698"
          width="1200"
          height="2"
          fill="rgb(var(--ink) / 0.22)"
        />
      </svg>

      {/* ---------- mobile: uma torre e o astro ----------
          Recorte EM RETRATO (360×640), na proporção da tela do celular.
          Com o recorte largo do desktop sobrava uma faixa morta embaixo
          e a torre ficava minúscula; assim ela ocupa a altura toda.

          O astro é o mesmo componente, só reposicionado: no desktop ele
          mora em x=920, longe demais para caber num quadro estreito.
          O translate o traz para o lado da torre. */}
      <svg
        viewBox="440 60 360 640"
        preserveAspectRatio="xMidYMax meet"
        className="bz-scene bz-scene-compacto"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bzTower-compacto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--predio-a)" />
            <stop offset="100%" stopColor="var(--predio-c)" />
          </linearGradient>
        </defs>

        <g
          transform="translate(-185 -10) scale(0.86)"
          style={{ transformOrigin: "920px 150px" }}
        >
          <Astro id="compacto" />
        </g>

        {/* Fora do <g> do astro: as estrelas não acompanham o translate
            do recorte compacto, elas têm posições próprias. */}
        <Estrelas pontos={ESTRELAS_COMPACTO} />
        {/* Duas só: o recorte do mobile é estreito e três viravam
            trânsito de nuvem. */}
        <Nuvem y={150} escala={0.7} className="bz-nuvem-a" />
        <Nuvem y={280} escala={0.55} className="bz-nuvem-b" />

        {/* Uma silhueta só, atrás da torre: sem nenhuma, a torre flutua
            sem chão; com várias, volta a poluir. */}
        <g className="bz-layer-bg">
          <rect
            x="690"
            y="420"
            width="120"
            height="280"
            fill="var(--predio-longe-a)"
          />
        </g>

        <g className="bz-layer-main">
          <TorrePrincipal id="compacto" />
        </g>

        {/* SEM linha de chão aqui, de propósito.
            No mobile a base da cena é dissolvida pelo desfoque da emenda
            (.bz-media-wrap::after). Uma linha de 2px atravessando a
            largura toda reaparecia por baixo dela em telas de outra
            proporção — era a "barrinha vazando" na parte de baixo. Quem
            marca o fim da cena agora é a própria emenda. */}
      </svg>
    </div>
  );
}
