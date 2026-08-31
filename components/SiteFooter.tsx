import Link from "next/link";
import { Facebook, Instagram, Mail, MessageCircle } from "lucide-react";
import { BrandMark } from "@/components/SiteNav";
import { linkWhatsAppGeral, linkWhatsAppAnunciar } from "@/lib/whatsapp";
import {
  CIDADE_UF,
  CREDITO,
  MARCA,
  facebookSemLink,
  handleRede,
  urlFacebook,
  urlInstagram,
} from "@/lib/marca";

/**
 * Link de lista do rodapé.
 *
 * O `py-1.5` não é respiro estético: sem ele o link tinha 20px de
 * altura (15px nos que levam ícone), abaixo dos 24px que a WCAG 2.2
 * pede como alvo mínimo de toque (critério 2.5.8). No celular, doze dos
 * treze links do rodapé falhavam essa medida — e rodapé é justamente
 * onde o polegar chega torto, no fim de uma rolagem longa.
 *
 * Por isso a coluna não usa `gap`: o espaçamento vem do padding dos
 * próprios links, que assim vira área clicável em vez de vão morto.
 */
function LinkRodape({
  href,
  externo,
  children,
}: {
  href: string;
  externo?: boolean;
  children: React.ReactNode;
}) {
  const classe =
    "inline-flex w-fit items-center gap-2 py-1.5 text-[13px] text-secundario transition-colors hover:text-black";
  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classe}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classe}>
      {children}
    </Link>
  );
}

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
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-9 px-4 pb-10 pt-12 md:grid-cols-4 md:gap-10 md:px-8">
        {/* Marca — logotipo completo, com a assinatura */}
        <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
          <div className="flex items-start gap-3">
            <BrandMark size={46} />
            <div>
              {/* text-black (a tinta, que acompanha o tema) e não
                  text-marinho fixo: no modo escuro o marinho ficava
                  invisível sobre o rodapé — 1,1:1 na auditoria. */}
              <p className="text-[15px] font-semibold tracking-tight text-black">
                {MARCA.nome}
              </p>
              {/* Filete dourado do logotipo — decorativo, não é texto.
                  A cidade saiu daqui: aparecia sob o logo, no bloco de
                  atendimento E na linha final. */}
              <span
                className="mt-1.5 block h-px w-14 bg-dourado"
                aria-hidden="true"
              />
            </div>
          </div>
          <p className="max-w-[26ch] text-[13px] italic leading-relaxed text-secundario">
            {MARCA.tagline}
          </p>
          <p className="max-w-[26ch] text-[13px] leading-relaxed text-secundario">
            Compra, venda e locação de imóveis residenciais e comerciais em{" "}
            {MARCA.regiao}.
          </p>
        </div>

        {/* Navegação */}
        <nav aria-label="Navegação do rodapé" className="flex flex-col">
          <p className="mb-1.5 text-[12px] md:text-[11px] font-medium uppercase tracking-[0.08em] text-secundario">
            Navegação
          </p>
          {NAVEGACAO.map(({ href, rotulo }) => (
            <LinkRodape key={href} href={href}>
              {rotulo}
            </LinkRodape>
          ))}
        </nav>

        {/* Atendimento.
            Uma coluna também no celular. Tentei col-span-2 por causa do
            e-mail (251px, mais largo que a meia tela de 375px), mas isso
            empurrava Navegação e "É proprietário?" para linhas próprias,
            cada uma com metade da largura vazia ao lado — o rodapé ficou
            MAIS alto que antes. Quem resolve o e-mail é o break-all
            abaixo. */}
        <div className="flex flex-col">
          <p className="mb-1.5 text-[12px] md:text-[11px] font-medium uppercase tracking-[0.08em] text-secundario">
            Atendimento
          </p>

          <LinkRodape href={linkWhatsAppGeral()} externo>
            {/* Sem verde: é um link de lista, ao lado de Instagram e
                e-mail, que têm ícone monocromático. */}
            <MessageCircle size={14} strokeWidth={2.25} aria-hidden="true" />
            WhatsApp
          </LinkRodape>

          <LinkRodape href={urlInstagram(MARCA.instagram)} externo>
            <Instagram size={14} strokeWidth={2} aria-hidden="true" />@
            {handleRede(MARCA.instagram)}
          </LinkRodape>

          {/* Facebook só entra se houver página cadastrada.
              urlFacebook resolve as três formas que podem chegar: URL
              colada, handle, ou o NOME da página. Hoje temos o nome
              ("Imóvel Vago Sorocaba"), que não vira endereço — então o
              link cai numa busca do Facebook. Assim que informarem o
              endereço da página, basta trocar o valor em lib/marca.ts:
              o link vira direto sem mexer aqui. */}
          {MARCA.facebook && (
            <LinkRodape href={urlFacebook(MARCA.facebook)} externo>
              <Facebook size={14} strokeWidth={2} aria-hidden="true" />
              {facebookSemLink(MARCA.facebook)
                ? MARCA.facebook
                : handleRede(MARCA.facebook)}
            </LinkRodape>
          )}

          {/* break-all no e-mail: em telas de 320px ele é mais largo que
              a coluna, e sem isto empurra a página para a rolagem
              horizontal. */}
          <LinkRodape href={`mailto:${MARCA.email}`}>
            <Mail size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
            <span className="break-all">{MARCA.email}</span>
          </LinkRodape>

          <p className="mt-2 text-[12px] leading-relaxed text-secundario">
            Seg. a sáb., 9h às 19h
            <br />
            {CIDADE_UF} e região
          </p>
        </div>

        {/* Proprietários */}
        <div className="col-span-2 flex flex-col gap-3 self-start md:col-span-1">
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
            /* px menor no celular: dividindo a linha com a Navegação, a
               coluna tem ~160px e o botão com px-5 encostava nas bordas. */
            className="inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-pill bg-black px-4 py-2.5 text-[12px] font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5 md:px-5"
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
              className="inline-block py-1.5 underline decoration-black/20 underline-offset-2 transition-colors hover:text-black"
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
                    className="inline-block py-1.5 underline decoration-black/15 underline-offset-2 transition-colors hover:text-black"
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
