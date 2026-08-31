import Link from "next/link";
import { ChevronDown, MessageCircle } from "lucide-react";
import CityScene from "@/components/CityScene";
import SiteNav from "@/components/SiteNav";
import { CIDADE_UF, MARCA } from "@/lib/marca";
import { linkWhatsAppGeral } from "@/lib/whatsapp";

/**
 * Hero fullscreen minimal — recriação em React da landing original.
 * Fundo com cena SVG de prédios, navbar fixa, heading em duas linhas,
 * CTAs em pill e linha de confiança com o CRECI.
 */
export default function Hero() {
  const whatsappHref = linkWhatsAppGeral();

  return (
    <div className="bz-page">
      {/* Fundo: cena SVG */}
      <div className="bz-media-wrap bz-anim bz-media-anim" aria-hidden="true">
        <CityScene />
      </div>

      <SiteNav whatsappHref={whatsappHref} animated />

      {/* Espaçador */}
      <div aria-hidden="true" />

      {/* Conteúdo inferior do hero */}
      <div className="bz-footer bz-anim bz-footer-anim">
        <div className="bz-footer-left">
          <h1 className="bz-heading">
            <span className="bz-line">
              <span className="bz-line-inner">Seu Imóvel,</span>
            </span>
            <span className="bz-line">
              <span className="bz-line-inner">Sem Complicação.</span>
            </span>
          </h1>

          <div className="bz-btn-row bz-anim bz-btns-anim">
            <a
              className="bz-btn bz-btn-primary"
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={15} strokeWidth={2.5} aria-hidden="true" />
              Falar no WhatsApp
            </a>
            <Link className="bz-btn bz-btn-secondary" href="/imoveis">
              Ver Imóveis
            </Link>
          </div>

          {/* Vinha ESCRITO À MÃO aqui — "CRECI 118400 · Sorocaba/SP e
              região" —, então quando o CRECI virou "118.400-F" e o nome
              ganhou "Sorocaba", a home continuou mostrando o número
              antigo enquanto o rodapé já mostrava o novo. Dois valores
              diferentes para o mesmo dado, na mesma página.

              Agora lê de lib/marca.ts, como todo o resto. */}
          <div className="bz-trust bz-anim bz-btns-anim">
            CRECI {MARCA.creci} · {CIDADE_UF} e região
          </div>
        </div>
        {/* O canto inferior direito fica livre de propósito: é onde mora
            o botão flutuante "Suporte". */}
      </div>

      {/* Convite sutil ao scroll (só desktop — no mobile o conteúdo já guia) */}
      <a
        href="#destaques"
        className="bz-scroll-hint bz-anim bz-btns-anim"
        aria-label="Ver imóveis em destaque"
      >
        <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
      </a>
    </div>
  );
}
