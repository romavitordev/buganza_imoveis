import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { linkWhatsAppGeral } from "@/lib/whatsapp";
import {
  MARCA,
  CIDADE_UF,
  CONTROLADOR,
  CONTROLADOR_COMPLETO,
} from "@/lib/marca";

/**
 * POLÍTICA DE PRIVACIDADE — Lei 13.709/2018 (LGPD).
 *
 * Escrita a partir de uma auditoria do que o sistema REALMENTE faz, e
 * não de um modelo genérico: política que descreve tratamento diferente
 * do que acontece é pior que nenhuma, porque cria uma promessa que o
 * site não cumpre.
 *
 * ESCRITA PARA O VISITANTE, e não para o revisor. As citações de artigo
 * ficam aqui no código, onde servem à revisão jurídica, em vez de pesar
 * no texto de quem só quer saber o que acontece com o WhatsApp dele. O
 * conteúdo obrigatório continua todo lá.
 *
 * Cobertura, por artigo:
 *  - art. 9º        — finalidade, forma, duração, controlador,
 *                     compartilhamento e direitos (o dever de informar)
 *  - art. 7º        — base legal de cada tratamento (a tabela)
 *  - art. 33        — transferência internacional: todos os
 *                     fornecedores de infraestrutura ficam fora do país
 *  - art. 15 e 16   — prazos de guarda, cumpridos por scripts/retencao.mjs
 *  - art. 18        — direitos do titular, e a ANPD no §1º
 *  - art. 13        — o dedupeHash é pseudonimização, NÃO anonimização
 *  - art. 46 e 48   — segurança e comunicação de incidente
 *
 * PORTE DA EMPRESA: a Resolução CD/ANPD nº 2/2022 dá tratamento
 * diferenciado ao "agente de tratamento de pequeno porte", que é o caso
 * de uma imobiliária deste tamanho. A principal consequência aqui: NÃO
 * é obrigatório nomear um encarregado formal, basta manter um canal de
 * comunicação com o titular. É por isso que a seção de contato fala em
 * canal, e não em cargo.
 *
 * Marco Civil (Lei 12.965/2014, art. 15): a guarda de registros de
 * acesso por 6 meses é OBRIGAÇÃO LEGAL, não escolha nossa.
 *
 * ISTO NÃO SUBSTITUI REVISÃO JURÍDICA.
 */

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Como a ${MARCA.nome} trata dados pessoais: o que coletamos, por quê, por quanto tempo e quais são os seus direitos, conforme a LGPD.`,
};

const ATUALIZADO_EM = "9 de agosto de 2026";

function Secao({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2
        id={id}
        className="mb-1 text-xl font-medium tracking-tight text-black"
      >
        {titulo}
      </h2>
      {children}
    </section>
  );
}

const Forte = ({ children }: { children: React.ReactNode }) => (
  <strong className="font-medium text-black">{children}</strong>
);

/** Linha da tabela de tratamentos: empilha no celular, alinha no desktop. */
function Linha({
  dado,
  finalidade,
  base,
  prazo,
}: {
  dado: string;
  finalidade: string;
  base: string;
  prazo: string;
}) {
  return (
    <div className="grid gap-1 border-t border-black/10 py-3 md:grid-cols-[1.1fr_1.4fr_0.9fr_0.8fr] md:gap-4">
      <div className="text-black">{dado}</div>
      <div>{finalidade}</div>
      <div>{base}</div>
      <div>{prazo}</div>
    </div>
  );
}

export default function PrivacidadePage() {
  const canal = CONTROLADOR.encarregado.email || MARCA.email;

  return (
    <>
      <SiteNav whatsappHref={linkWhatsAppGeral()} />

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <header className="bz-fade-up mb-10">
          <p className="mb-2 flex items-center gap-2 text-[13px] text-secundario">
            <span className="bz-dot" aria-hidden="true" />
            Transparência
          </p>
          <h1 className="text-4xl tracking-tight md:text-5xl">
            Política de Privacidade
          </h1>
          <p className="mt-3 text-[13px] text-secundario">
            Última atualização: {ATUALIZADO_EM} · Lei nº 13.709/2018 (LGPD)
          </p>
        </header>

        <div className="flex flex-col gap-8 text-[15px] leading-relaxed text-secundario">
          <Secao id="pp-resumo" titulo="O essencial">
            <p>
              Você não precisa criar cadastro para usar este site. Não usamos
              cookies de publicidade, não montamos perfil para anúncios e{" "}
              <Forte>não vendemos nem cedemos dados a ninguém</Forte>.
            </p>
            <p>
              Guardamos duas coisas: o contato que{" "}
              <Forte>você decide deixar</Forte> para falar sobre um imóvel, e
              uma contagem de visitas que não identifica você pelo nome.
            </p>
          </Secao>

          <Secao id="pp-controlador" titulo="Quem é o responsável">
            {/* Sem os dados da empresa, a página NÃO mostra colchete de
                "preencher" — isso é bilhete interno vazando para o
                visitante. Ela cai para a identificação pelo nome
                fantasia e CRECI, que é verdadeira e publicável. Falta o
                CNPJ para ficar completa aos olhos da LGPD, e quem cobra
                isso é o CHECKLIST-DEPLOY (2.6) e o aviso no build. */}
            <p>
              {CONTROLADOR_COMPLETO ? (
                <>
                  <Forte>{CONTROLADOR.razaoSocial}</Forte>, CNPJ{" "}
                  {CONTROLADOR.cnpj}, {CONTROLADOR.endereco} — atua como{" "}
                  {MARCA.nome}, CRECI {MARCA.creci}, em {CIDADE_UF}.
                </>
              ) : (
                <>
                  <Forte>{MARCA.nome}</Forte> — CRECI {MARCA.creci}, em{" "}
                  {CIDADE_UF}.
                </>
              )}
            </p>
            <p>
              Para qualquer assunto sobre seus dados, incluindo os pedidos
              descritos mais abaixo, escreva para{" "}
              <a
                href={`mailto:${canal}`}
                className="underline decoration-black/30 underline-offset-2 hover:decoration-black"
              >
                {canal}
              </a>
              .
            </p>
          </Secao>

          <Secao id="pp-tratamentos" titulo="O que guardamos e por quanto tempo">
            <div className="mt-1 text-[14px]">
              <div className="hidden grid-cols-[1.1fr_1.4fr_0.9fr_0.8fr] gap-4 pb-2 text-[12px] font-medium uppercase tracking-wide text-secundario md:grid">
                <div>Dado</div>
                <div>Para quê</div>
                <div>Base legal</div>
                <div>Prazo</div>
              </div>

              <Linha
                dado="Nome e WhatsApp que você deixa"
                finalidade="Retornar o contato sobre o imóvel que você perguntou"
                base="Seu consentimento"
                prazo="24 meses"
              />
              <Linha
                dado="A mensagem que você escreve"
                finalidade="Entender o que você procura e responder"
                base="Seu consentimento"
                prazo="24 meses"
              />
              <Linha
                dado="Um código do seu aparelho, sem seu nome"
                finalidade="Contar visitas sem contar a mesma pessoa duas vezes no dia"
                base="Legítimo interesse"
                prazo="12 meses"
              />
              <Linha
                dado="Tipo de aparelho e de onde veio a visita"
                finalidade="Saber se o site é mais usado no celular e o que traz gente"
                base="Legítimo interesse"
                prazo="12 meses"
              />
              <Linha
                dado="Seu IP nos registros de acesso"
                finalidade="Segurança e cumprimento do Marco Civil da Internet"
                base="Obrigação legal"
                prazo="6 meses"
              />
            </div>

            <p className="mt-3">
              Não guardamos seu IP junto com a contagem de visitas: ele vira um
              código embaralhado que só serve para não contar a mesma visita
              duas vezes no dia. Ainda assim a lei considera isso dado pessoal,
              e por isso ele está na tabela com prazo como os outros.
            </p>
            <p>
              Não tratamos dados sensíveis, não tomamos nenhuma decisão
              automática sobre você e o site não é destinado a menores de 18
              anos.
            </p>
          </Secao>

          <Secao id="pp-cookies" titulo="Cookies">
            <p>
              <Forte>Nenhuma página pública deste site usa cookies.</Forte> É
              por isso que você não vê banner pedindo permissão — não há nada a
              permitir.
            </p>
            <p>
              Seus imóveis favoritos e a preferência de tema ficam guardados{" "}
              <Forte>no seu próprio navegador</Forte> e nunca chegam até nós.
              Limpar os dados do site apaga os dois.
            </p>
          </Secao>

          <Secao id="pp-compartilhamento" titulo="Com quem compartilhamos">
            <p>
              Com ninguém para fins de publicidade. Apenas com as empresas que
              fazem o site funcionar, e só no que elas precisam:{" "}
              <Forte>Vercel</Forte> (hospedagem), <Forte>Neon</Forte> (banco de
              dados), <Forte>Supabase</Forte> (fotos e vídeos),{" "}
              <Forte>Resend</Forte> (aviso por e-mail quando você deixa contato)
              e <Forte>Upstash</Forte> (proteção contra abuso).{" "}
              <Forte>Essas empresas mantêm servidores fora do Brasil</Forte>,
              então seus dados podem ser processados no exterior com as
              garantias contratuais exigidas pela lei.
            </p>
            <p>
              O mapa da página do imóvel vem do <Forte>Google</Forte> e os
              vídeos do <Forte>YouTube</Forte> em modo sem cookies: ao carregar,
              seu navegador fala direto com eles. E ao clicar em um botão de
              WhatsApp, a conversa passa a ser regida pela política da{" "}
              <Forte>Meta</Forte>.
            </p>
          </Secao>

          <Secao id="pp-direitos" titulo="Seus direitos">
            <p>
              A qualquer momento e sem custo, você pode pedir para{" "}
              <Forte>
                saber quais dados temos, corrigi-los, apagá-los, recebê-los em
                arquivo, saber com quem foram compartilhados
              </Forte>{" "}
              ou <Forte>retirar seu consentimento</Forte>. É só escrever para{" "}
              <a
                href={`mailto:${canal}`}
                className="underline decoration-black/30 underline-offset-2 hover:decoration-black"
              >
                {canal}
              </a>
              . Respondemos em até 15 dias e podemos confirmar sua identidade
              antes — é uma proteção sua.
            </p>
            <p>
              Alguns registros continuam guardados mesmo após um pedido de
              exclusão, quando a lei obriga: é o caso dos registros de acesso
              exigidos pelo Marco Civil da Internet.
            </p>
            <p>
              Se a nossa resposta não resolver, você pode reclamar à{" "}
              <Forte>ANPD</Forte>, a autoridade nacional de proteção de dados,
              em{" "}
              <a
                href="https://www.gov.br/anpd"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-black/30 underline-offset-2 hover:decoration-black"
              >
                gov.br/anpd
              </a>
              .
            </p>
          </Secao>

          <Secao id="pp-seguranca" titulo="Segurança e mudanças">
            <p>
              O site usa conexão criptografada, o painel dos corretores exige
              senha com verificação em duas etapas disponível, e o acesso aos
              contatos é restrito a quem precisa atender você. Se acontecer um
              incidente que traga risco relevante, avisaremos você e a ANPD.
            </p>
            <p>
              Se mudarmos algo nesta política, a data no topo muda junto —
              ela sempre indica a versão vigente.
            </p>
          </Secao>

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
