import Link from "next/link";
import { Instagram, Mail, MessageCircle } from "lucide-react";
import { BrandMark } from "@/components/SiteNav";
import { linkWhatsAppGeral } from "@/lib/whatsapp";

export default function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <div>
            <p className="text-sm font-semibold tracking-tight">
              Imóveis Buganza
            </p>
            <p className="text-[11px] text-black/45">
              CRECI 118400 · Sorocaba/SP
            </p>
          </div>
        </div>

        <nav
          className="flex flex-wrap items-center gap-2"
          aria-label="Links do rodapé"
        >
          <Link
            href="/imoveis"
            className="rounded-pill border border-black/12 px-4 py-2 text-[12px] font-medium text-black/75 transition-colors hover:border-black"
          >
            Ver Imóveis
          </Link>
          <a
            href={linkWhatsAppGeral()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-pill bg-black px-4 py-2 text-[12px] font-medium text-white"
          >
            <MessageCircle
              size={13}
              strokeWidth={2.5}
              className="text-[#25D366]"
              aria-hidden="true"
            />
            WhatsApp
          </a>
          <a
            href="https://instagram.com/imoveis_buganza"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram @imoveis_buganza"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/12 text-black/70 transition-colors hover:border-black"
          >
            <Instagram size={14} strokeWidth={2} aria-hidden="true" />
          </a>
          <a
            href="mailto:imoveisbuganza@gmail.com"
            aria-label="Enviar e-mail"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/12 text-black/70 transition-colors hover:border-black"
          >
            <Mail size={14} strokeWidth={2} aria-hidden="true" />
          </a>
        </nav>
      </div>
    </footer>
  );
}
