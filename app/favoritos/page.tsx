import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import FavoritosList from "@/components/FavoritosList";
import { linkWhatsAppGeral } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Imóveis que você salvou para ver depois.",
  // Lista pessoal do visitante — não faz sentido indexar
  robots: { index: false, follow: true },
};

export default function FavoritosPage() {
  return (
    <>
      <SiteNav whatsappHref={linkWhatsAppGeral()} />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 md:px-8 md:pt-36">
        <header className="bz-fade-up mb-10">
          <p className="mb-2 flex items-center gap-2 text-[13px] text-black/55">
            <span className="bz-dot" aria-hidden="true" />
            Salvos neste dispositivo
          </p>
          <h1 className="text-4xl tracking-tight md:text-5xl">Favoritos</h1>
        </header>

        <FavoritosList />
      </main>

      <SiteFooter />
    </>
  );
}
