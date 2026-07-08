import Link from "next/link";
import { Instagram, Mail, MessageCircle } from "lucide-react";
import { BrandMark } from "@/components/SiteNav";
import { linkWhatsAppGeral, linkWhatsAppAnunciar } from "@/lib/whatsapp";

const NAVEGACAO = [
  { href: "/", rotulo: "Início" },
  { href: "/imoveis", rotulo: "Imóveis" },
  { href: "/#como-funciona", rotulo: "Como funciona" },
  { href: "/#quem-somos", rotulo: "Quem somos" },
  { href: "/#faq", rotulo: "Perguntas frequentes" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-white">
      {/* pb extra no mobile por causa da bottom nav fixa */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-10 pt-12 sm:grid-cols-2 md:grid-cols-4 md:px-8">
        {/* Marca */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <p className="text-sm font-semibold tracking-tight">
              Imóveis Buganza
            </p>
          </div>
          <p className="max-w-[26ch] text-[13px] leading-relaxed text-black/55">
            Compra, venda e locação de imóveis residenciais e comerciais em
            Sorocaba e região — sem complicação.
          </p>
          <p className="text-[11px] text-black/40">CRECI 118400</p>
        </div>

        {/* Navegação */}
        <nav aria-label="Navegação do rodapé" className="flex flex-col gap-2">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-black/40">
            Navegação
          </p>
          {NAVEGACAO.map(({ href, rotulo }) => (
            <Link
              key={href}
              href={href}
              className="w-fit text-[13px] text-black/65 transition-colors hover:text-black"
            >
              {rotulo}
            </Link>
          ))}
        </nav>

        {/* Atendimento */}
        <div className="flex flex-col gap-2">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-black/40">
            Atendimento
          </p>
          <a
            href={linkWhatsAppGeral()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 text-[13px] text-black/65 transition-colors hover:text-black"
          >
            <MessageCircle
              size={14}
              strokeWidth={2.25}
              className="text-[#25D366]"
              aria-hidden="true"
            />
            WhatsApp
          </a>
          <a
            href="https://instagram.com/imoveis_buganza"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 text-[13px] text-black/65 transition-colors hover:text-black"
          >
            <Instagram size={14} strokeWidth={2} aria-hidden="true" />
            @imoveis_buganza
          </a>
          <a
            href="mailto:imoveisbuganza@gmail.com"
            className="inline-flex w-fit items-center gap-2 text-[13px] text-black/65 transition-colors hover:text-black"
          >
            <Mail size={14} strokeWidth={2} aria-hidden="true" />
            imoveisbuganza@gmail.com
          </a>
          <p className="mt-1 text-[12px] leading-relaxed text-black/45">
            Seg. a sáb., 9h às 19h
            <br />
            Sorocaba/SP e região
          </p>
        </div>

        {/* Proprietários */}
        <div className="flex flex-col gap-3">
          <p className="mb-0 text-[11px] font-medium uppercase tracking-[0.08em] text-black/40">
            É proprietário?
          </p>
          <p className="text-[13px] leading-relaxed text-black/55">
            Anuncie seu imóvel com a gente — você só paga na conclusão do
            negócio.
          </p>
          <a
            href={linkWhatsAppAnunciar()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-pill bg-black px-5 py-2.5 text-[12px] font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
          >
            <MessageCircle
              size={13}
              strokeWidth={2.5}
              className="text-[#25D366]"
              aria-hidden="true"
            />
            Anunciar imóvel
          </a>
        </div>
      </div>

      {/* Linha final */}
      <div className="border-t border-black/8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 pb-28 pt-5 text-[11px] text-black/40 md:flex-row md:items-center md:px-8 md:pb-5">
          <p>
            © {new Date().getFullYear()} Imóveis Buganza · CRECI 118400 ·
            Sorocaba/SP
          </p>
          <Link
            href="/privacidade"
            className="underline decoration-black/20 underline-offset-2 transition-colors hover:text-black"
          >
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
