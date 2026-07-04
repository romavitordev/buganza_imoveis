"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Plus } from "lucide-react";

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

export default function SiteNav({ whatsappHref, animated }: SiteNavProps) {
  const [menuAberto, setMenuAberto] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!menuAberto) return;

    function onClick(e: MouseEvent) {
      const alvo = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(alvo) &&
        btnRef.current &&
        !btnRef.current.contains(alvo)
      ) {
        setMenuAberto(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuAberto(false);
        btnRef.current?.focus();
      }
    }

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuAberto]);

  return (
    <>
      <nav
        className={`bz-nav ${animated ? "bz-anim bz-nav-anim" : ""}`}
        aria-label="Principal"
      >
        <div className="bz-nav-left">
          <Link className="bz-brand" href="/" aria-label="Imóveis Buganza">
            <BrandMark />
            <span className="bz-brand-text">Imóveis Buganza</span>
          </Link>

          <button
            ref={btnRef}
            className="bz-menu-btn"
            type="button"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto((v) => !v)}
          >
            <span className="bz-menu-circle">
              <Plus size={12} strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="bz-menu-label">Menu</span>
          </button>

          <div className="bz-tags-pill">
            <span>Residencial</span>
            <span>Comercial</span>
          </div>
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

      {menuAberto && (
        <div className="bz-menu-panel" ref={panelRef}>
          <Link href="/imoveis" onClick={() => setMenuAberto(false)}>
            Ver Imóveis
          </Link>
          <Link href="/#quem-somos" onClick={() => setMenuAberto(false)}>
            Quem Somos
          </Link>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            Falar no WhatsApp
          </a>
          <a
            href="https://instagram.com/imoveis_buganza"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <a href="mailto:imoveisbuganza@gmail.com">E-mail</a>
        </div>
      )}
    </>
  );
}
