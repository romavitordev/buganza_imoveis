import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { siteUrl } from "@/lib/site-url";
import ChatWidget from "@/components/ChatWidget";
import "./globals.css";
import { MARCA } from "@/lib/marca";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default:
      `${MARCA.nome} — Especialistas em Imóveis Residenciais e Comerciais`,
    template: `%s · ${MARCA.nome}`,
  },
  description:
    `${MARCA.nome}: compra, venda e locação de imóveis residenciais e comerciais em ${MARCA.regiao}. CRECI ${MARCA.creci}. Fale conosco pelo WhatsApp.`,
};

// Dados estruturados do negócio (Google) — telefone fica de fora de
// propósito: o número de WhatsApp é server-only (ver /api/contato)
const negocioJsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: MARCA.nome,
  description:
    "Compra, venda e locação de imóveis residenciais e comerciais em Sorocaba e região.",
  url: siteUrl(),
  identifier: `CRECI ${MARCA.creci}`,
  areaServed: `${MARCA.regiao}, ${MARCA.uf}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: MARCA.cidade,
    addressRegion: MARCA.uf,
    addressCountry: "BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(negocioJsonLd) }}
        />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
