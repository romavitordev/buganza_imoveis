"use client";

import { useEffect, useRef } from "react";

/**
 * Cena SVG do hero — prédios pretos minimalistas sobre céu claro.
 * Recriação fiel da landing original: torres com janelas em grade,
 * algumas acesas com brilho pulsante alternado, torres cinzas de fundo
 * e disco de sol discreto.
 *
 * Efeito de scroll (reversível, ligado ao progresso do scroll):
 *  - saindo do hero: silhuetas de fundo somem descendo (fade out),
 *    torres principais descem e desaparecem;
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
}

function WindowGrid({ x, y, cols, rows, w, h, gx, gy, lit }: WindowGridProps) {
  const litSet = new Set(lit);
  const windows = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const isLit = litSet.has(idx);
      windows.push(
        <rect
          key={idx}
          x={x + c * (w + gx)}
          y={y + r * (h + gy)}
          width={w}
          height={h}
          fill={isLit ? "#ffffff" : "rgba(255,255,255,0.14)"}
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

export default function CityScene() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const reduzMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduzMovimento) return;

    let raf = 0;

    function aplicar() {
      raf = 0;
      const el = svgRef.current;
      if (!el) return;
      // Progresso 0 → 1 ao longo de ~70% da altura da viewport
      const progresso = Math.min(
        Math.max(window.scrollY / (window.innerHeight * 0.7), 0),
        1
      );
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
    <svg
      ref={svgRef}
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMax meet"
      className="bz-scene"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bzTower" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c0c0e" />
          <stop offset="100%" stopColor="#1a1a1d" />
        </linearGradient>
      </defs>

      {/* O céu é o degradê do wrapper (.bz-media-wrap) — o SVG fica
          transparente para não criar emenda em telas de qualquer proporção */}

      {/* Sol/disco discreto */}
      <g className="bz-layer-sun">
        <circle cx="920" cy="150" r="70" fill="#ffffff" opacity="0.9" />
        <circle cx="920" cy="150" r="70" fill="none" stroke="rgba(0,0,0,0.06)" />
      </g>

      {/* Silhuetas de fundo — somem descendo ao scrollar */}
      <g className="bz-layer-bg">
        <g fill="#d8d8dc">
          <rect x="60" y="300" width="120" height="400" />
          <rect x="330" y="260" width="90" height="440" />
          <rect x="760" y="320" width="110" height="380" />
          <rect x="1050" y="280" width="100" height="420" />
        </g>
        <g fill="#9a9aa0">
          <rect x="150" y="340" width="100" height="360" />
          <rect x="700" y="380" width="80" height="320" />
          <rect x="960" y="360" width="120" height="340" />
        </g>
      </g>

      {/* Torres principais — descem e desaparecem ao scrollar */}
      <g className="bz-layer-main">
        {/* Torre principal — preta, centro-direita */}
        <g>
          <rect x="480" y="140" width="180" height="560" fill="url(#bzTower)" />
          <rect x="480" y="128" width="180" height="12" fill="#000" />
          <rect x="550" y="96" width="6" height="32" fill="#000" />
          <WindowGrid
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

        {/* Torre secundária — preta, esquerda */}
        <g>
          <rect x="230" y="240" width="130" height="460" fill="#101013" />
          <rect x="230" y="230" width="130" height="10" fill="#000" />
          <WindowGrid
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
          <rect x="820" y="440" width="220" height="260" fill="#131316" />
          <WindowGrid
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
      <rect x="0" y="698" width="1200" height="2" fill="rgba(0,0,0,0.25)" />
    </svg>
  );
}
