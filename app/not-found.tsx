import Link from "next/link";
import { MessageCircle } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { linkWhatsAppGeral } from "@/lib/whatsapp";

export default function NotFound() {
  return (
    <>
      <SiteNav whatsappHref={linkWhatsAppGeral()} />
      <main className="flex min-h-[100svh] flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-[13px] font-medium uppercase tracking-wide text-black/40">
          Erro 404
        </p>
        <h1 className="max-w-xl text-4xl tracking-tight md:text-5xl">
          Este imóvel já encontrou um dono — ou a página não existe.
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-black/55">
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
