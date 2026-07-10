"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Building2, Heart, Home, MessageCircle, Users } from "lucide-react";

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

type Secao = "topo" | "quem-somos" | null;

const LINKS: {
  href: string;
  rotulo: string;
  icone: typeof Home;
  secao: Secao;
}[] = [
  { href: "/", rotulo: "Início", icone: Home, secao: "topo" },
  { href: "/imoveis", rotulo: "Imóveis", icone: Building2, secao: null },
  { href: "/favoritos", rotulo: "Favoritos", icone: Heart, secao: null },
  { href: "/#quem-somos", rotulo: "Quem Somos", icone: Users, secao: "quem-somos" },
];

function prefereMenosMovimento(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function SiteNav({ whatsappHref, animated }: SiteNavProps) {
  const pathname = usePathname();
  const naHome = pathname === "/";

  // Estado "scrolled": a barra ganha fundo/borda ao rolar, para o logo e o
  // CTA não flutuarem soltos sobre o conteúdo
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    let raf = 0;
    function aplicar() {
      raf = 0;
      setRolou(window.scrollY > 24);
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(aplicar);
    }
    aplicar();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Seção visível na home, detectada por scroll (IntersectionObserver)
  const [secaoAtiva, setSecaoAtiva] = useState<Secao>("topo");

  useEffect(() => {
    if (!naHome) return;
    const alvo = document.getElementById("quem-somos");
    if (!alvo) return;
    const obs = new IntersectionObserver(
      ([entry]) => setSecaoAtiva(entry.isIntersecting ? "quem-somos" : "topo"),
      // troca por volta do meio da tela
      { rootMargin: "-45% 0px -50% 0px" }
    );
    obs.observe(alvo);
    return () => obs.disconnect();
  }, [naHome]);

  // Índice do link ativo dentro de LINKS (-1 = nenhum)
  const indiceAtivo = naHome
    ? LINKS.findIndex((l) => l.secao === secaoAtiva)
    : LINKS.findIndex(
        (l) =>
          l.href !== "/" &&
          (pathname === l.href || pathname.startsWith(`${l.href}/`))
      );

  // Scroll suave para seções da home (com offset da navbar via scroll-margin)
  const rolarPara = useCallback(
    (e: MouseEvent, secao: Secao) => {
      if (!naHome || secao === null) return; // deixa o Next navegar normalmente
      e.preventDefault();
      const comportamento: ScrollBehavior = prefereMenosMovimento()
        ? "auto"
        : "smooth";
      if (secao === "topo") {
        window.scrollTo({ top: 0, behavior: comportamento });
      } else {
        document
          .getElementById(secao)
          ?.scrollIntoView({ behavior: comportamento, block: "start" });
      }
    },
    [naHome]
  );

  // ---- indicador deslizante (desktop) ----
  const desktopRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indDesktop, setIndDesktop] = useState({
    left: 0,
    width: 0,
    pronto: false,
  });

  useLayoutEffect(() => {
    function medir() {
      const container = desktopRef.current;
      const el = linkRefs.current[indiceAtivo];
      if (!container || !el || indiceAtivo < 0) {
        setIndDesktop((s) => ({ ...s, pronto: false }));
        return;
      }
      const cr = container.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      setIndDesktop({ left: er.left - cr.left, width: er.width, pronto: true });
    }
    medir();
    // remede após o carregamento da fonte (larguras mudam)
    const t = window.setTimeout(medir, 140);
    window.addEventListener("resize", medir);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", medir);
    };
  }, [indiceAtivo, pathname]);

  // ---- indicador deslizante (mobile, 4 colunas iguais) ----
  const bottomRef = useRef<HTMLDivElement>(null);
  const [larguraBottom, setLarguraBottom] = useState(0);

  useLayoutEffect(() => {
    function medir() {
      if (bottomRef.current) setLarguraBottom(bottomRef.current.clientWidth);
    }
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  const colunaMobile = larguraBottom / 5;
  const bottomLeft =
    indiceAtivo >= 0 ? (indiceAtivo + 0.5) * colunaMobile - 24 : 0;

  return (
    <>
      {/* ---------- barra superior ---------- */}
      <nav
        className={`bz-nav ${rolou ? "bz-nav-scrolled" : ""} ${
          animated ? "bz-anim bz-nav-anim" : ""
        }`}
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
        <div
          ref={desktopRef}
          className="relative hidden items-center gap-1 rounded-pill bg-white/85 p-1 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur md:flex"
        >
          <span
            aria-hidden="true"
            className="bz-nav-indicator"
            style={{
              transform: `translateX(${indDesktop.left}px)`,
              width: indDesktop.width,
              opacity: indDesktop.pronto ? 1 : 0,
            }}
          />
          {LINKS.map(({ href, rotulo, secao }, i) => {
            const ativo = i === indiceAtivo;
            return (
              <Link
                key={href}
                href={href}
                ref={(el) => {
                  linkRefs.current[i] = el;
                }}
                onClick={(e) => rolarPara(e, secao)}
                aria-current={ativo ? "page" : undefined}
                className={`relative z-10 rounded-pill px-4 py-2 text-[12px] font-medium transition-colors duration-300 ${
                  ativo ? "text-white" : "text-black/65 hover:text-black"
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
        <div ref={bottomRef} className="relative grid h-16 grid-cols-5">
          <span
            aria-hidden="true"
            className="bz-bottomnav-indicator"
            style={{
              transform: `translateX(${bottomLeft}px)`,
              opacity: indiceAtivo >= 0 && larguraBottom > 0 ? 1 : 0,
            }}
          />
          {LINKS.map(({ href, rotulo, icone: Icone, secao }, i) => {
            const ativo = i === indiceAtivo;
            return (
              <Link
                key={href}
                href={href}
                onClick={(e) => rolarPara(e, secao)}
                aria-current={ativo ? "page" : undefined}
                className={`relative z-10 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors duration-300 ${
                  ativo ? "text-black" : "text-black/45"
                }`}
              >
                <span className="flex h-7 w-12 items-center justify-center">
                  <Icone
                    size={17}
                    strokeWidth={ativo ? 2.25 : 1.75}
                    aria-hidden="true"
                    className={ativo ? "text-white" : ""}
                  />
                </span>
                {rotulo}
              </Link>
            );
          })}

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-black/45"
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
