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
    // suppressHydrationWarning: o script abaixo escreve data-theme no
    // <html> antes de o React montar, então o atributo que veio do
    // servidor e o que está no DOM divergem — de propósito.
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/*
          Tema aplicado ANTES da primeira pintura. Se isto fosse um
          useEffect, quem escolheu o modo escuro veria a página piscar
          branca a cada navegação. É inline e síncrono de propósito.
          Sem preferência salva, segue o sistema operacional.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("bz-tema");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
      </head>
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
