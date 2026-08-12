import Link from "next/link";
import { ChevronDown, MessageCircle } from "lucide-react";
import CityScene from "@/components/CityScene";
import SiteNav from "@/components/SiteNav";
import NavBusca from "@/components/NavBusca";
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

      {/* Busca do mobile.
       *
       * Mora no espaçador do meio, que num celular é a faixa de céu
       * vazio entre a navbar e o título. É o único lugar da primeira
       * dobra onde ela não empurra nada: o conteúdo do hero é ancorado
       * embaixo (`.bz-page` é um flex com space-between).
       *
       * Fica no fluxo, e não fixa: rolar a página leva a busca embora
       * junto com o hero, como deve ser. Uma barra grudada no topo do
       * celular passaria a vida cobrindo o conteúdo.
       *
       * No desktop ela some — lá a busca vive dentro da navbar. */}
      {/* A navbar é `position: fixed`, então ela não empurra nada: sem
          este respiro a busca nasceria ATRÁS dela, em y=12. Os 73px são
          a altura medida da barra no celular; o resto é folga. */}
      <div className="relative z-40 pt-[86px] lg:pt-0">
        <NavBusca variante="mobile" />
      </div>

      {/* Conteúdo inferior do hero */}
      <div className="bz-footer bz-anim bz-footer-anim">
        <div className="bz-footer-left">
          <div className="bz-subtitle bz-anim bz-sub-anim">
            <span className="bz-dot" />
            Especialistas em imóveis residenciais e comerciais
          </div>

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

          <div className="bz-trust bz-anim bz-btns-anim">
            CRECI 118400 · Sorocaba/SP e região
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
