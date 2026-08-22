import Link from "next/link";
import { Facebook, Instagram, Mail, MessageCircle } from "lucide-react";
import { BrandMark } from "@/components/SiteNav";
import { linkWhatsAppGeral, linkWhatsAppAnunciar } from "@/lib/whatsapp";
import { CIDADE_UF, MARCA, CREDITO } from "@/lib/marca";

const NAVEGACAO = [
  { href: "/", rotulo: "Início" },
  { href: "/imoveis", rotulo: "Imóveis" },
  { href: "/favoritos", rotulo: "Favoritos" },
  { href: "/#como-funciona", rotulo: "Como funciona" },
  { href: "/#quem-somos", rotulo: "Quem somos" },
  { href: "/#faq", rotulo: "Perguntas frequentes" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-white">
      {/* pb extra no mobile por causa da bottom nav fixa */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-10 pt-12 sm:grid-cols-2 md:grid-cols-4 md:px-8">
        {/* Marca — logotipo completo, com a assinatura */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <BrandMark size={46} />
            <div>
              {/* text-black (a tinta, que acompanha o tema) e não
                  text-marinho fixo: no modo escuro o marinho ficava
                  invisível sobre o rodapé — 1,1:1 na auditoria. */}
              <p className="text-[15px] font-semibold tracking-tight text-black">
                {MARCA.nome}
              </p>
              {/* Filete dourado do logotipo — decorativo, não é texto */}
              <span
                className="mt-1.5 block h-px w-14 bg-dourado"
                aria-hidden="true"
              />
              <p className="mt-1.5 text-[12px] md:text-[11px] font-medium uppercase tracking-[0.14em] text-secundario">
                {CIDADE_UF}
              </p>
            </div>
          </div>
          <p className="max-w-[26ch] text-[13px] italic leading-relaxed text-secundario">
            {MARCA.tagline}
          </p>
          <p className="max-w-[26ch] text-[13px] leading-relaxed text-secundario">
            Compra, venda e locação de imóveis residenciais e comerciais em{" "}
            {MARCA.regiao}.
          </p>
          <p className="text-[12px] md:text-[11px] text-secundario">CRECI {MARCA.creci}</p>
        </div>

        {/* Navegação */}
        <nav aria-label="Navegação do rodapé" className="flex flex-col gap-2">
          <p className="mb-1 text-[12px] md:text-[11px] font-medium uppercase tracking-[0.08em] text-secundario">
            Navegação
          </p>
          {NAVEGACAO.map(({ href, rotulo }) => (
            <Link
              key={href}
              href={href}
              className="w-fit text-[13px] text-secundario transition-colors hover:text-black"
            >
              {rotulo}
            </Link>
          ))}
        </nav>

        {/* Atendimento */}
        <div className="flex flex-col gap-2">
          <p className="mb-1 text-[12px] md:text-[11px] font-medium uppercase tracking-[0.08em] text-secundario">
            Atendimento
          </p>
          <a
            href={linkWhatsAppGeral()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 text-[13px] text-secundario transition-colors hover:text-black"
          >
            {/* Sem verde: é um link de lista, ao lado de Instagram e
                e-mail, que têm ícone monocromático. */}
            <MessageCircle size={14} strokeWidth={2.25} aria-hidden="true" />
            WhatsApp
          </a>
          <a
            href={`https://instagram.com/${MARCA.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 text-[13px] text-secundario transition-colors hover:text-black"
          >
            <Instagram size={14} strokeWidth={2} aria-hidden="true" />
            @{MARCA.instagram}
          </a>
          {/* Facebook só entra se houver página cadastrada. A busca por
              NOME (e não por URL) é proposital: eles informaram "Imóvel
              Vago Sorocaba", que é o nome da página, não o endereço dela.
              Link para uma URL inventada levaria o visitante a lugar
              nenhum — pior do que não ter link. Trocar por permalink
              assim que souberem qual é. */}
          {MARCA.facebook && (
            <a
              href={`https://www.facebook.com/search/top?q=${encodeURIComponent(
                MARCA.facebook
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 text-[13px] text-secundario transition-colors hover:text-black"
            >
              <Facebook size={14} strokeWidth={2} aria-hidden="true" />
              {MARCA.facebook}
            </a>
          )}
          <a
            href={`mailto:${MARCA.email}`}
            className="inline-flex w-fit items-center gap-2 text-[13px] text-secundario transition-colors hover:text-black"
          >
            <Mail size={14} strokeWidth={2} aria-hidden="true" />
            {MARCA.email}
          </a>
          <p className="mt-1 text-[12px] leading-relaxed text-secundario">
            Seg. a sáb., 9h às 19h
            <br />
            {CIDADE_UF} e região
          </p>
        </div>

        {/* Proprietários */}
        <div className="flex flex-col gap-3">
          <p className="mb-0 text-[12px] md:text-[11px] font-medium uppercase tracking-[0.08em] text-secundario">
            É proprietário?
          </p>
          <p className="text-[13px] leading-relaxed text-secundario">
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
              aria-hidden="true"
            />
            Anunciar imóvel
          </a>
        </div>
      </div>

      {/* Linha final */}
      <div className="border-t border-black/8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 pb-28 pt-5 text-[12px] md:text-[11px] text-secundario md:flex-row md:items-center md:px-8 md:pb-5">
          <p>
            © {new Date().getFullYear()} {MARCA.nome} · CRECI {MARCA.creci} ·{" "}
            {CIDADE_UF}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href="/privacidade"
              className="underline decoration-black/20 underline-offset-2 transition-colors hover:text-black"
            >
              Política de Privacidade
            </Link>

            {/* ASSINATURA DE QUEM FEZ O SITE.
             *
             * Discreta de propósito: um crédito de quem constrói não pode
             * disputar atenção com o CRECI nem com a política, que são o
             * que o visitante pode precisar. Vem com um ponto separando,
             * no mesmo tamanho e na mesma cor apagada do resto da linha.
             *
             * SEM opacidade extra de propósito. Já tentei /70 para
             * deixá-lo mais discreto: no tema claro isso derrubou o
             * contraste para 3,11:1, abaixo do mínimo de 4,5:1 da WCAG
             * para texto de 11px — enquanto o link vizinho, na mesma
             * linha, fica em 5,95:1. Só a partir de /95 voltaria a
             * passar, o que não é discrição nenhuma. A assinatura já é
             * discreta pelo tamanho e pela posição.
             *
             * Some por completo se CREDITO.nome ficar vazio. A
             * assinatura esperou o estúdio ter nome de verdade: um
             * provisório publicado é indexado e vira o nome pelo qual o
             * trabalho passa a ser conhecido. */}
            {CREDITO.nome && (
              <span className="text-secundario">
                Site produzido por{" "}
                {CREDITO.url ? (
                  <a
                    href={CREDITO.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-black/15 underline-offset-2 transition-colors hover:text-black"
                  >
                    {CREDITO.nome}
                  </a>
                ) : (
                  CREDITO.nome
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
