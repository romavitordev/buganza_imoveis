import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { siteUrl } from "@/lib/site-url";
import ChatWidget from "@/components/ChatWidget";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default:
      "Imóveis Buganza — Especialistas em Imóveis Residenciais e Comerciais",
    template: "%s · Imóveis Buganza",
  },
  description:
    "Imóveis Buganza: compra, venda e locação de imóveis residenciais e comerciais em Sorocaba e região. CRECI 118400. Fale conosco pelo WhatsApp.",
};

// Dados estruturados do negócio (Google) — telefone fica de fora de
// propósito: o número de WhatsApp é server-only (ver /api/contato)
const negocioJsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "Imóveis Buganza",
  description:
    "Compra, venda e locação de imóveis residenciais e comerciais em Sorocaba e região.",
  url: siteUrl(),
  identifier: "CRECI 118400",
  areaServed: "Sorocaba e região, SP",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Sorocaba",
    addressRegion: "SP",
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
