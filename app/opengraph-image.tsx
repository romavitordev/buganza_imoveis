import { ImageResponse } from "next/og";
import { MARCA, CIDADE_UF, CORES } from "@/lib/marca";

/**
 * OG image da marca — aparece quando o site é compartilhado no WhatsApp,
 * Instagram etc. As páginas de imóvel usam a foto de capa (definida na
 * metadata delas); esta imagem cobre home, catálogo e demais páginas.
 *
 * Fundo marinho, e não branco, de propósito: a prévia do WhatsApp fica
 * sobre um balão claro, então o cartão escuro recorta e a marca aparece
 * antes do texto. É também onde o dourado pode virar texto — sobre o
 * marinho ele passa dos 4,5:1 exigidos (sobre branco, não passaria).
 */

export const runtime = "edge";
export const alt = `${MARCA.nome} — Seu Imóvel, Sem Complicação. ${CIDADE_UF} · CRECI ${MARCA.creci}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Silhueta minimalista de prédios (mesma linguagem do hero)
const PREDIOS: {
  largura: number;
  altura: number;
  cor: string;
  janelas?: boolean;
}[] = [
  { largura: 90, altura: 160, cor: "#22406F" },
  { largura: 110, altura: 260, cor: "#182C55", janelas: true },
  { largura: 70, altura: 190, cor: "#2B4C7E" },
  { largura: 150, altura: 340, cor: "#0F1D3A", janelas: true },
  { largura: 90, altura: 220, cor: "#1B3160", janelas: true },
  { largura: 80, altura: 150, cor: "#22406F" },
  { largura: 120, altura: 280, cor: "#152848", janelas: true },
  { largura: 70, altura: 180, cor: "#2B4C7E" },
];

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(180deg, ${CORES.marinhoClaro} 0%, ${CORES.marinho} 62%, #0D1B36 100%)`,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Lua/sol discreto, em dourado suave */}
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 120,
            width: 130,
            height: 130,
            borderRadius: 999,
            background: "rgba(224,194,126,0.16)",
            border: `1px solid ${CORES.dourado}`,
          }}
        />

        {/* Texto */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "72px 80px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginBottom: 28,
            }}
          >
            <span
              style={{
                fontSize: 24,
                letterSpacing: 6,
                color: CORES.douradoClaro,
                textTransform: "uppercase",
              }}
            >
              {MARCA.nome}
            </span>
            {/* filete dourado do logotipo */}
            <span
              style={{ width: 96, height: 1, background: CORES.dourado }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 92,
              lineHeight: 1.05,
              letterSpacing: -3,
              color: "#ffffff",
            }}
          >
            <span style={{ fontWeight: 300 }}>Seu Imóvel,</span>
            <span style={{ fontWeight: 700 }}>Sem Complicação.</span>
          </div>
          <div
            style={{
              marginTop: 30,
              fontSize: 26,
              color: "rgba(255,255,255,0.72)",
            }}
          >
            Compra · Venda · Locação — {CIDADE_UF} · CRECI {MARCA.creci}
          </div>
        </div>

        {/* Silhueta de prédios na base */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 14,
            padding: "0 60px",
            borderBottom: `6px solid ${CORES.dourado}`,
          }}
        >
          {PREDIOS.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignContent: "flex-start",
                gap: 8,
                padding: p.janelas ? "16px 12px" : 0,
                width: p.largura,
                height: p.altura,
                background: p.cor,
              }}
            >
              {p.janelas
                ? Array.from({ length: 9 }).map((_, j) => (
                    <div
                      key={j}
                      style={{
                        width: 14,
                        height: 12,
                        // janela acesa em dourado, como na cena do hero
                        background:
                          j % 3 === 0
                            ? CORES.douradoClaro
                            : "rgba(255,255,255,0.14)",
                      }}
                    />
                  ))
                : null}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
