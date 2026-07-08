import { ImageResponse } from "next/og";

/**
 * OG image da marca — aparece quando o site é compartilhado no WhatsApp,
 * Instagram etc. As páginas de imóvel usam a foto de capa (definida na
 * metadata delas); esta imagem cobre home, catálogo e demais páginas.
 */

export const runtime = "edge";
export const alt =
  "Imóveis Buganza — Seu Imóvel, Sem Complicação. Sorocaba/SP · CRECI 118400";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Silhueta minimalista de prédios (mesma linguagem do hero)
const PREDIOS: {
  largura: number;
  altura: number;
  cor: string;
  janelas?: boolean;
}[] = [
  { largura: 90, altura: 160, cor: "#d8d8dc" },
  { largura: 110, altura: 260, cor: "#111114", janelas: true },
  { largura: 70, altura: 190, cor: "#9a9aa0" },
  { largura: 150, altura: 340, cor: "#0c0c0e", janelas: true },
  { largura: 90, altura: 220, cor: "#131316", janelas: true },
  { largura: 80, altura: 150, cor: "#d8d8dc" },
  { largura: 120, altura: 280, cor: "#101013", janelas: true },
  { largura: 70, altura: 180, cor: "#9a9aa0" },
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
          background: "linear-gradient(180deg, #ffffff 0%, #ececee 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Sol discreto */}
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 120,
            width: 130,
            height: 130,
            borderRadius: 999,
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.06)",
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
              fontSize: 24,
              letterSpacing: 6,
              color: "rgba(0,0,0,0.55)",
              marginBottom: 28,
            }}
          >
            IMÓVEIS BUGANZA
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 92,
              lineHeight: 1.05,
              letterSpacing: -3,
              color: "#000",
            }}
          >
            <span style={{ fontWeight: 300 }}>Seu Imóvel,</span>
            <span style={{ fontWeight: 700 }}>Sem Complicação.</span>
          </div>
          <div
            style={{
              marginTop: 30,
              fontSize: 26,
              color: "rgba(0,0,0,0.5)",
            }}
          >
            Compra · Venda · Locação — Sorocaba/SP · CRECI 118400
          </div>
        </div>

        {/* Silhueta de prédios na base */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 14,
            padding: "0 60px",
            borderBottom: "6px solid rgba(0,0,0,0.25)",
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
                        background:
                          j % 3 === 0
                            ? "#ffffff"
                            : "rgba(255,255,255,0.16)",
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
