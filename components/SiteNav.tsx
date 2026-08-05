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
import { Building2, Headset, Heart, Home, MessageCircle, Users } from "lucide-react";
import { CORES, MARCA } from "@/lib/marca";
import { abrirSuporte } from "@/lib/suporte";
import ThemeToggle from "@/components/ThemeToggle";

interface SiteNavProps {
  whatsappHref: string;
  /** Anima a entrada (usado no hero da home). */
  animated?: boolean;
}

/**
 * Logotipo oficial. É PNG com fundo transparente e 320px de altura —
 * ~7x o maior uso na tela (46px no rodapé), então continua nítido em
 * telas de alta densidade. Se um dia existir a versão vetorial, troque
 * por "/logo.svg" e o resto continua igual.
 *
 * O prefixo existe por causa da vitrine (layout_buganza), que no GitHub
 * Pages mora em /layout_buganza: um caminho absoluto cru daria 404 lá.
 * O <img> comum não recebe o basePath automático do Next (só o
 * next/image recebe), e trocar por next/image exigiria fixar a proporção
 * do arquivo no código. Aqui a variável fica vazia e nada muda.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ARQUIVO_LOGO = `${BASE}/logo.png`;
/**
 * Variante para fundo escuro: mesmo desenho, com o marinho trocado pelo
 * tom de tinta do modo escuro. Sem ela, metade do logotipo (justamente
 * a metade marinho) desapareceria contra o fundo noturno — só o dourado
 * sobreviveria e a marca ficaria irreconhecível.
 */
const ARQUIVO_LOGO_ESCURO = `${BASE}/logo-escuro.png`;

/**
 * Logotipo da marca.
 *
 * Usa os arquivos oficiais em `public/` — são ELES que mandam. O desenho
 * abaixo (MonogramaFallback) só aparece se o arquivo faltar, para a
 * navbar nunca mostrar ícone quebrado; ele é uma aproximação, não a
 * marca. Trocar o logotipo = substituir o arquivo, sem tocar em código.
 *
 * As duas versões (clara e escura) são renderizadas sempre e quem
 * escolhe é o CSS, como no sol/lua da cena: assim o tema não vira estado
 * do React e não há divergência entre servidor e hidratação.
 *
 * A altura é que manda — a largura acompanha a proporção do arquivo.
 */
export function BrandMark({ size = 30 }: { size?: number }) {
  const [semArquivo, setSemArquivo] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // O onError sozinho não basta: a imagem vem no HTML do servidor e pode
  // falhar ANTES da hidratação, quando o handler ainda não existe — daí
  // ficaria um espaço vazio. Depois de montar, conferimos o resultado
  // pelo próprio elemento (carregada, mas com largura 0 = quebrada).
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setSemArquivo(true);
  }, []);

  if (!semArquivo) {
    const estilo = { height: size, width: "auto" } as const;
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={ARQUIVO_LOGO}
          alt=""
          aria-hidden="true"
          style={estilo}
          className="bz-logo-claro flex-none"
          onError={() => setSemArquivo(true)}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ARQUIVO_LOGO_ESCURO}
          alt=""
          aria-hidden="true"
          style={estilo}
          className="bz-logo-escuro flex-none"
        />
      </>
    );
  }
  return <MonogramaFallback size={size} />;
}

/**
 * Aproximação do monograma, desenhada em SVG. Só entra em cena quando
 * `public/logo.svg` não existe.
 */
function MonogramaFallback({ size }: { size: number }) {
  // Abaixo de ~34px os detalhes finos (segundo prédio, base curva)
  // viram borrão e sujam a leitura do M. Nesse tamanho desenhamos só o
  // essencial — é o mesmo princípio dos ícones de sistema, que têm
  // desenhos diferentes por tamanho em vez de um só reduzido.
  const detalhado = size >= 34;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="flex-none"
    >
      {/* Prédios subindo atrás do M. Terminam bem acima do vértice (y=20)
          para não encostarem nas hastes — encostando, o desenho lê como
          "N" em vez de M. Só na versão detalhada. */}
      {detalhado && (
        <>
          <rect x="13.4" y="2.5" width="3" height="10" fill={CORES.marinho} />
          <rect x="17" y="5.5" width="2.4" height="7" fill={CORES.dourado} />
        </>
      )}
      {/* O M: esquerda marinho, direita dourada. Vértice alto (V raso),
          como no logotipo — deixa espaço para a casa embaixo. */}
      <path
        d="M6 26 V10 L16 20"
        stroke={CORES.marinho}
        strokeWidth={detalhado ? 3.4 : 3.8}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M16 20 L26 10 V26"
        stroke={CORES.dourado}
        strokeWidth={detalhado ? 3.4 : 3.8}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* janelinha da casa, sob o vértice */}
      <rect
        x="14.3"
        y="21.6"
        width="3.4"
        height="3.4"
        rx="0.4"
        fill={CORES.marinho}
      />
      {detalhado && (
        /* base do logotipo — quase reta, só uma leve curva */
        <path
          d="M4.5 28.8 Q16 27.4 27.5 28.8"
          stroke={CORES.marinho}
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      )}
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
          aria-label={`${MARCA.nome} — início`}
        >
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight text-black">
            {MARCA.nome}
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
                  ativo ? "text-white" : "text-black/75 hover:text-black"
                }`}
              >
                {rotulo}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Atendimento — só no mobile. No desktop quem abre o chat é o
              botão flutuante do ChatWidget; aqui ele evita empilhar mais
              um elemento fixo na base da tela, que já tem a bottom nav.
              Ícone de headset, e não de balão, para não virar um segundo
              botão igual ao do WhatsApp ao lado. */}
          <button
            type="button"
            onClick={abrirSuporte}
            aria-label={`Abrir atendimento ${MARCA.assistente}`}
            className="bz-contact-pill md:hidden"
          >
            <span className="bz-contact-circle">
              <Headset size={14} strokeWidth={2.5} aria-hidden="true" />
            </span>
          </button>

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
        </div>
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
                  ativo ? "text-black" : "text-black/70"
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
            className="relative z-10 flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-black/70"
          >
            {/* Glifo branco, não verde: aqui ele é um item de navegação
                ao lado de outros quatro, e o verde o transformava no
                elemento mais forte da barra. */}
            <span className="flex h-7 w-12 items-center justify-center rounded-pill bg-black text-white">
              <MessageCircle size={17} strokeWidth={2.25} aria-hidden="true" />
            </span>
            WhatsApp
          </a>
        </div>
      </nav>
    </>
  );
}
