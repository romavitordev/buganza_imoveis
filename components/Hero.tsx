import Link from "next/link";
import { MessageCircle } from "lucide-react";
import CityScene from "@/components/CityScene";
import SiteNav from "@/components/SiteNav";
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
          <div className="bz-subtitle bz-anim bz-sub-anim">
            <span className="bz-dot" />
            Especialistas em imóveis residenciais e comerciais
          </div>

          <h1 className="bz-heading bz-anim bz-head-anim">
            Seu Imóvel,
            <br />
            Sem Complicação.
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

          <div className="bz-trust bz-anim bz-btns-anim">CRECI 118400</div>
        </div>

        <div className="bz-right-tags bz-anim bz-btns-anim">
          <span>Compra</span>
          <span>Venda</span>
          <span>Locação</span>
        </div>
      </div>
    </div>
  );
}
