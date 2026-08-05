import Link from "next/link";
import { MessageCircle } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { linkWhatsAppGeral } from "@/lib/whatsapp";

export default function NotFound() {
  return (
    <>
      <SiteNav whatsappHref={linkWhatsAppGeral()} />
      <main className="flex min-h-[100svh] flex-col items-center justify-center gap-6 px-4 text-center">
        {/* Mini cena de prédios — mesma identidade do hero */}
        <svg
          viewBox="0 0 320 130"
          width="240"
          aria-hidden="true"
          className="opacity-90"
        >
          <circle cx="262" cy="34" r="20" fill="#ffffff" />
          <circle cx="262" cy="34" r="20" fill="none" stroke="rgba(20,38,74,0.12)" />
          <rect x="10" y="58" width="34" height="72" fill="#DCE0EA" />
          <rect x="272" y="66" width="34" height="64" fill="#DCE0EA" />
          <rect x="52" y="42" width="44" height="88" fill="#1B3160" />
          <rect x="52" y="36" width="44" height="6" fill="#0F1D3A" />
          <rect x="130" y="16" width="58" height="114" fill="#14264A" />
          <rect x="130" y="10" width="58" height="6" fill="#0F1D3A" />
          <rect x="154" y="0" width="4" height="10" fill="#0F1D3A" />
          <rect x="206" y="54" width="52" height="76" fill="#182C55" />
          {[0, 1, 2].map((c) =>
            [0, 1, 2, 3].map((r) => (
              <rect
                key={`m${c}-${r}`}
                x={140 + c * 14}
                y={28 + r * 22}
                width="8"
                height="7"
                /* janela acesa em dourado, como na cena do hero */
                fill={
                  (c + r) % 3 === 0 ? "#E0C27E" : "rgba(255,255,255,0.14)"
                }
              />
            ))
          )}
          <rect x="0" y="128" width="320" height="2" fill="rgba(20,38,74,0.22)" />
        </svg>

        <p className="text-[13px] font-medium uppercase tracking-wide text-black/70">
          Erro 404
        </p>
        <h1 className="max-w-xl text-4xl tracking-tight md:text-5xl">
          Este imóvel já encontrou um dono — ou a página não existe.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-black/70">
          O anúncio pode ter sido vendido, alugado ou pausado. Veja o catálogo
          atualizado ou fale direto com a gente.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/imoveis"
            className="rounded-pill bg-black px-6 py-3 text-[13px] font-medium text-white"
          >
            Ver imóveis disponíveis
          </Link>
          <a
            href={linkWhatsAppGeral()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-pill border border-black/35 px-6 py-3 text-[13px] font-medium transition-colors hover:border-black"
          >
            <MessageCircle size={15} strokeWidth={2.5} aria-hidden="true" />
            Falar no WhatsApp
          </a>
        </div>
      </main>
    </>
  );
}
