import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { linkWhatsAppGeral } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a Imóveis Buganza trata os dados de quem navega no site: analytics anônimo, sem venda de dados, em conformidade com a LGPD.",
};

const ATUALIZADO_EM = "4 de julho de 2026";

export default function PrivacidadePage() {
  return (
    <>
      <SiteNav whatsappHref={linkWhatsAppGeral()} />

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <header className="bz-fade-up mb-10">
          <p className="mb-2 flex items-center gap-2 text-[13px] text-black/55">
            <span className="bz-dot" aria-hidden="true" />
            Transparência
          </p>
          <h1 className="text-4xl tracking-tight md:text-5xl">
            Política de Privacidade
          </h1>
          <p className="mt-3 text-[13px] text-black/45">
            Última atualização: {ATUALIZADO_EM}
          </p>
        </header>

        <div className="flex flex-col gap-8 text-[15px] leading-relaxed text-black/70">
          <section aria-labelledby="pp-resumo">
            <h2
              id="pp-resumo"
              className="mb-2 text-xl font-medium tracking-tight text-black"
            >
              Resumo em uma frase
            </h2>
            <p>
              Não pedimos cadastro, não usamos cookies de publicidade e não
              vendemos dados: coletamos apenas estatísticas anônimas de
              navegação para entender quais imóveis despertam mais interesse.
            </p>
          </section>

          <section aria-labelledby="pp-coletamos">
            <h2
              id="pp-coletamos"
              className="mb-2 text-xl font-medium tracking-tight text-black"
            >
              O que coletamos automaticamente
            </h2>
            <p className="mb-3">
              Ao navegar pelo site, registramos de forma{" "}
              <strong className="font-medium text-black">anônima</strong>:
            </p>
            <ul className="flex list-disc flex-col gap-2 pl-5">
              <li>
                Quais páginas de imóveis foram visualizadas e quais botões de
                WhatsApp foram clicados;
              </li>
              <li>
                O tipo de dispositivo (celular, computador ou tablet) e a
                origem do acesso (por exemplo, Instagram ou Google);
              </li>
              <li>
                Um identificador técnico <em>pseudonimizado</em> (código
                irreversível gerado a partir do endereço IP e do navegador),
                usado exclusivamente para não contar o mesmo dispositivo duas
                vezes. O endereço IP em si{" "}
                <strong className="font-medium text-black">
                  nunca é armazenado
                </strong>
                .
              </li>
            </ul>
            <p className="mt-3">
              Essas informações não permitem identificar você e são usadas com
              base no legítimo interesse (art. 7º, IX da LGPD) para melhorar o
              site e o atendimento.
            </p>
          </section>

          <section aria-labelledby="pp-armazenamento">
            <h2
              id="pp-armazenamento"
              className="mb-2 text-xl font-medium tracking-tight text-black"
            >
              Armazenamento local no seu navegador
            </h2>
            <p>
              Usamos o armazenamento local do navegador (localStorage) apenas
              para lembrar quais imóveis você já visualizou — assim sua visita
              não é contada em duplicidade. Não usamos cookies de rastreamento
              de terceiros nem ferramentas de publicidade.
            </p>
          </section>

          <section aria-labelledby="pp-whatsapp">
            <h2
              id="pp-whatsapp"
              className="mb-2 text-xl font-medium tracking-tight text-black"
            >
              Quando você fala conosco no WhatsApp
            </h2>
            <p>
              Todo contato acontece pelo WhatsApp, por iniciativa sua. Nesse
              momento, recebemos seu nome e número de telefone diretamente no
              aplicativo, e os usamos somente para o atendimento solicitado —
              nunca para envio de propaganda sem seu consentimento nem para
              compartilhamento com terceiros. A conversa também está sujeita à{" "}
              <a
                href="https://www.whatsapp.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-black/30 underline-offset-2 hover:decoration-black"
              >
                política de privacidade do WhatsApp
              </a>
              .
            </p>
          </section>

          <section aria-labelledby="pp-mapas">
            <h2
              id="pp-mapas"
              className="mb-2 text-xl font-medium tracking-tight text-black"
            >
              Mapas incorporados
            </h2>
            <p>
              As páginas de imóveis exibem um mapa do Google Maps com a
              localização aproximada (bairro). Ao carregar o mapa, o Google
              pode coletar dados conforme a própria{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-black/30 underline-offset-2 hover:decoration-black"
              >
                política de privacidade do Google
              </a>
              .
            </p>
          </section>

          <section aria-labelledby="pp-direitos">
            <h2
              id="pp-direitos"
              className="mb-2 text-xl font-medium tracking-tight text-black"
            >
              Seus direitos (LGPD)
            </h2>
            <p>
              A Lei Geral de Proteção de Dados (Lei nº 13.709/2018) garante a
              você o direito de saber quais dados tratamos, corrigi-los ou
              pedir a exclusão. Como nosso analytics é anônimo, normalmente não
              há o que excluir — mas se você já falou conosco no WhatsApp e
              quiser que apaguemos seu contato, basta pedir na própria conversa
              ou pelo e-mail abaixo.
            </p>
          </section>

          <section aria-labelledby="pp-contato">
            <h2
              id="pp-contato"
              className="mb-2 text-xl font-medium tracking-tight text-black"
            >
              Fale com a gente
            </h2>
            <p>
              Dúvidas sobre esta política: {" "}
              <a
                href="mailto:imoveisbuganza@gmail.com"
                className="underline decoration-black/30 underline-offset-2 hover:decoration-black"
              >
                imoveisbuganza@gmail.com
              </a>{" "}
              · Imóveis Buganza · CRECI 118400 · Sorocaba/SP.
            </p>
          </section>

          <div className="mt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-pill border border-black/30 px-6 py-3 text-[13px] font-medium text-black transition-colors hover:border-black"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
