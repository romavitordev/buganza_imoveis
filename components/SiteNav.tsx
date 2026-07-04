"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home, MessageCircle, Users } from "lucide-react";

interface SiteNavProps {
  whatsappHref: string;
  /** Anima a entrada (usado no hero da home). */
  animated?: boolean;
}

/** Logo — torre preta minimalista. */
export function BrandMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <rect x="4" y="8" width="8" height="16" rx="1" fill="#000" />
      <rect x="14" y="2" width="8" height="22" rx="1" fill="#000" />
      <rect x="6.5" y="11" width="3" height="2.4" fill="#fff" opacity="0.85" />
      <rect x="6.5" y="16" width="3" height="2.4" fill="#fff" opacity="0.85" />
      <rect x="16.5" y="6" width="3" height="2.4" fill="#fff" opacity="0.85" />
      <rect x="16.5" y="11" width="3" height="2.4" fill="#fff" opacity="0.85" />
      <rect x="16.5" y="16" width="3" height="2.4" fill="#fff" opacity="0.85" />
    </svg>
  );
}

const LINKS = [
  { href: "/", rotulo: "Início", icone: Home },
  { href: "/imoveis", rotulo: "Imóveis", icone: Building2 },
  { href: "/#quem-somos", rotulo: "Quem Somos", icone: Users },
];

function linkAtivo(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteNav({ whatsappHref, animated }: SiteNavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* ---------- barra superior ---------- */}
      <nav
        className={`bz-nav ${animated ? "bz-anim bz-nav-anim" : ""}`}
        aria-label="Principal"
      >
        <Link
          className="flex items-center gap-2"
          href="/"
          aria-label="Imóveis Buganza — início"
        >
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight text-black">
            Imóveis Buganza
          </span>
        </Link>

        {/* Links inline — só desktop; no mobile a navegação fica na barra inferior */}
        <div className="hidden items-center gap-1 rounded-pill bg-white/85 p-1 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur md:flex">
          {LINKS.map(({ href, rotulo }) => {
            const ativo = linkAtivo(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={`rounded-pill px-4 py-2 text-[12px] font-medium transition-colors ${
                  ativo
                    ? "bg-black text-white"
                    : "text-black/65 hover:bg-black/5 hover:text-black"
                }`}
              >
                {rotulo}
              </Link>
            );
          })}
        </div>

        <a
          className="bz-contact-pill"
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="bz-contact-circle">
            <MessageCircle size={14} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span className="bz-contact-label">Fale Conosco</span>
        </a>
      </nav>

      {/* ---------- bottom nav (só mobile) ---------- */}
      <nav
        aria-label="Navegação inferior"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="grid h-16 grid-cols-4">
          {LINKS.map(({ href, rotulo, icone: Icone }) => {
            const ativo = linkAtivo(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  ativo ? "text-black" : "text-black/45"
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-pill transition-colors ${
                    ativo ? "bg-black text-white" : ""
                  }`}
                >
                  <Icone size={17} strokeWidth={ativo ? 2.25 : 1.75} aria-hidden="true" />
                </span>
                {rotulo}
              </Link>
            );
          })}

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-black/45"
          >
            <span className="flex h-7 w-12 items-center justify-center rounded-pill bg-black text-[#25D366]">
              <MessageCircle size={17} strokeWidth={2.25} aria-hidden="true" />
            </span>
            WhatsApp
          </a>
        </div>
      </nav>
    </>
  );
}
