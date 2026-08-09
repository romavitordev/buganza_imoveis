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
 * O que a lei exige e está coberto aqui:
 *  - art. 9º, I    — identificação do controlador
 *  - art. 9º, II   — finalidade específica de cada tratamento
 *  - art. 7º       — base legal de cada tratamento (a coluna que mais
 *                    falta nas políticas de PME)
 *  - art. 9º, V    — com quem os dados são compartilhados
 *  - art. 33       — transferência internacional (todos os nossos
 *                    fornecedores de infraestrutura ficam fora do país)
 *  - art. 15/16    — por quanto tempo cada dado fica
 *  - art. 18       — os nove direitos do titular, um a um
 *  - art. 18, §1º  — ANPD como canal de reclamação
 *  - art. 41       — encarregado, com contato público
 *  - art. 46       — medidas de segurança
 *  - art. 48       — comunicação de incidente
 *  - art. 14       — dados de crianças e adolescentes
 *
 * Também o Marco Civil da Internet (Lei 12.965/2014, art. 15), que
 * OBRIGA a guardar registros de acesso por 6 meses — é por isso que essa
 * retenção aparece como obrigação legal, e não como escolha nossa.
 *
 * ISTO NÃO SUBSTITUI REVISÃO JURÍDICA. Um advogado precisa ler antes de
 * publicar, principalmente as bases legais e a transferência
 * internacional.
 */

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Como a ${MARCA.nome} trata dados pessoais: bases legais, prazos, compartilhamento e os direitos do titular, conforme a LGPD (Lei 13.709/2018).`,
};

const ATUALIZADO_EM = "9 de agosto de 2026";

/** Cabeçalho de seção — mesma tipografia em todas. */
function Titulo({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="mb-2 text-xl font-medium tracking-tight text-black"
    >
      {children}
    </h2>
  );
}

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
      <Titulo id={id}>{titulo}</Titulo>
      {children}
    </section>
  );
}

const Forte = ({ children }: { children: React.ReactNode }) => (
  <strong className="font-medium text-black">{children}</strong>
);

/** Linha de tabela responsiva: vira bloco empilhado no celular. */
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
    <div className="grid gap-1 border-t border-black/10 py-3 md:grid-cols-4 md:gap-4">
      <div className="text-black">{dado}</div>
      <div>{finalidade}</div>
      <div>{base}</div>
      <div>{prazo}</div>
    </div>
  );
}

export default function PrivacidadePage() {
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
          {/* Aviso de publicação incompleta. Some sozinho quando os dados
              da empresa forem preenchidos em lib/marca.ts. É deliberadamente
              chamativo: publicar sem identificar o controlador é descumprir
              o art. 9º, I. */}
          {!CONTROLADOR_COMPLETO && (
            <div className="rounded-xl border-2 border-dourado bg-dourado/10 p-4 text-[14px] text-black">
              <Forte>Esta política ainda não está pronta para publicação.</Forte>{" "}
              Faltam a razão social, o CNPJ, o endereço e o encarregado pela
              proteção de dados — informações que a LGPD exige (arts. 9º, I e
              41) e que só a imobiliária pode fornecer. Preencha em{" "}
              <code className="rounded bg-black/5 px-1">lib/marca.ts</code> e
              peça a revisão de um advogado antes de publicar.
            </div>
          )}

          <Secao id="pp-resumo" titulo="Resumo">
            <p>
              Você <Forte>não precisa criar cadastro</Forte> para usar este
              site. Não usamos cookies de publicidade, não fazemos perfil
              comportamental para anúncios e{" "}
              <Forte>não vendemos nem alugamos dados a ninguém</Forte>.
            </p>
            <p>
              Coletamos duas coisas: o contato que{" "}
              <Forte>você mesmo decide deixar</Forte> quando quer falar sobre
              um imóvel, e uma medição de audiência com identificador
              pseudonimizado, para saber quais imóveis despertam mais
              interesse. Os detalhes de cada uma estão abaixo.
            </p>
          </Secao>

          <Secao id="pp-controlador" titulo="Quem é o controlador">
            <p>
              O controlador dos dados tratados neste site é{" "}
              <Forte>
                {CONTROLADOR.razaoSocial || "[razão social a preencher]"}
              </Forte>
              {CONTROLADOR.cnpj ? `, CNPJ ${CONTROLADOR.cnpj}` : ", CNPJ [a preencher]"}
              {CONTROLADOR.endereco ? `, com sede em ${CONTROLADOR.endereco}` : ", endereço [a preencher]"}
              , que atua no mercado imobiliário sob o nome{" "}
              {MARCA.nome} — CRECI {MARCA.creci} — em {CIDADE_UF}.
            </p>
            <p>
              <Forte>Encarregado pela proteção de dados</Forte> (art. 41 da
              LGPD):{" "}
              {CONTROLADOR.encarregado.nome || "[nome a preencher]"} —{" "}
              <a
                href={`mailto:${CONTROLADOR.encarregado.email || MARCA.email}`}
                className="underline decoration-black/30 underline-offset-2 hover:decoration-black"
              >
                {CONTROLADOR.encarregado.email || MARCA.email}
              </a>
              . É esse o canal para exercer os direitos descritos mais
              adiante.
            </p>
          </Secao>

          <Secao
            id="pp-tratamentos"
            titulo="O que tratamos, por quê, com que base e por quanto tempo"
          >
            <p>
              A LGPD exige uma <Forte>base legal</Forte> para cada tratamento
              (art. 7º). Esta é a lista completa — não há tratamento fora
              dela:
            </p>

            <div className="mt-2 text-[14px]">
              <div className="hidden grid-cols-4 gap-4 pb-2 text-[12px] font-medium uppercase tracking-wide text-secundario md:grid">
                <div>Dado</div>
                <div>Finalidade</div>
                <div>Base legal</div>
                <div>Prazo</div>
              </div>

              <Linha
                dado="Nome e WhatsApp que você deixa no atendimento"
                finalidade="Retornar o contato sobre o imóvel que você perguntou"
                base="Consentimento (art. 7º, I)"
                prazo="24 meses, ou antes disso se você pedir a exclusão"
              />
              <Linha
                dado="Mensagem que você escreve no chat"
                finalidade="Entender o que você procura e responder"
                base="Consentimento (art. 7º, I)"
                prazo="24 meses, junto com o contato"
              />
              <Linha
                dado="Identificador pseudonimizado do dispositivo"
                finalidade="Contar visitas e cliques sem contar a mesma pessoa duas vezes no dia"
                base="Legítimo interesse (art. 7º, IX)"
                prazo="12 meses"
              />
              <Linha
                dado="Tipo de aparelho e origem do acesso"
                finalidade="Saber se o site é mais usado no celular e de onde vêm as visitas"
                base="Legítimo interesse (art. 7º, IX)"
                prazo="12 meses"
              />
              <Linha
                dado="Endereço IP nos registros de acesso"
                finalidade="Segurança, prevenção a abuso e cumprimento do Marco Civil"
                base="Obrigação legal (art. 7º, II) — Lei 12.965/2014, art. 15"
                prazo="6 meses"
              />
              <Linha
                dado="Perguntas sem resposta feitas ao atendimento"
                finalidade="Melhorar as respostas do atendimento automático"
                base="Legítimo interesse (art. 7º, IX)"
                prazo="12 meses"
              />
            </div>

            <p className="mt-3">
              <Forte>Sobre o identificador pseudonimizado:</Forte> não gravamos
              seu endereço IP na medição de audiência. Ele é combinado ao
              navegador e ao imóvel visitado e transformado num código
              irreversível na prática para nós, que só serve para não contar a
              mesma visita duas vezes no mesmo dia. Ainda assim,{" "}
              <Forte>a LGPD trata isso como dado pessoal pseudonimizado</Forte>{" "}
              (art. 13), e não como dado anônimo — por isso ele aparece nesta
              lista, com base legal e prazo, como qualquer outro.
            </p>
            <p>
              <Forte>Não tratamos dados sensíveis</Forte> (art. 5º, II) e{" "}
              <Forte>não tomamos decisões automatizadas</Forte> que afetem
              seus interesses. O atendimento automático responde dúvidas sobre
              os imóveis; ele não avalia, classifica nem aprova ninguém.
            </p>
          </Secao>

          <Secao id="pp-cookies" titulo="Cookies e armazenamento local">
            <p>
              Este site <Forte>não usa cookies em nenhuma página pública</Forte>
              . Não há cookie de publicidade, de rede social nem de medição de
              audiência de terceiros — e é por isso que você não vê um banner
              de consentimento pedindo permissão: não há nada a permitir.
            </p>
            <p>
              Duas informações ficam guardadas <Forte>no seu navegador</Forte>{" "}
              e nunca são enviadas para nós: os imóveis que você marca como
              favoritos e a sua preferência de tema (claro ou escuro). Limpar
              os dados do site no navegador apaga as duas.
            </p>
            <p>
              Existe um único cookie no sistema — <code>bz_admin</code> —, e
              ele só é criado quando um corretor faz login no painel
              administrativo. Ele é estritamente necessário para manter a
              sessão e não acompanha visitantes.
            </p>
          </Secao>

          <Secao id="pp-compartilhamento" titulo="Com quem compartilhamos">
            <p>
              Não vendemos, não alugamos e não cedemos dados para fins
              publicitários. Compartilhamos apenas com os fornecedores de
              infraestrutura necessários para o site funcionar, que atuam como{" "}
              <Forte>operadores</Forte> (art. 5º, VII) e só podem tratar os
              dados conforme nossas instruções:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <Forte>Vercel</Forte> — hospedagem do site e registros de
                acesso
              </li>
              <li>
                <Forte>Neon</Forte> — banco de dados onde ficam os imóveis e
                os contatos deixados
              </li>
              <li>
                <Forte>Supabase</Forte> — armazenamento das fotos e vídeos dos
                imóveis
              </li>
              <li>
                <Forte>Resend</Forte> — envio do aviso por e-mail quando você
                deixa um contato
              </li>
              <li>
                <Forte>Upstash</Forte> — controle de excesso de requisições
                (proteção contra abuso)
              </li>
            </ul>
            <p>
              Além deles, duas páginas embutem conteúdo de terceiros:{" "}
              <Forte>Google Maps</Forte>, que mostra a região do imóvel, e{" "}
              <Forte>YouTube</Forte> em modo sem cookies, quando o anúncio tem
              vídeo. Ao carregar esses trechos, o seu navegador se comunica
              diretamente com essas empresas, que passam a ter acesso ao seu
              IP e seguem as políticas de privacidade delas.
            </p>
            <p>
              Se você clicar em um botão de WhatsApp, a conversa passa a
              ocorrer dentro do aplicativo e é regida pela política de
              privacidade da <Forte>Meta</Forte>.
            </p>
          </Secao>

          <Secao
            id="pp-internacional"
            titulo="Transferência internacional de dados"
          >
            <p>
              Os fornecedores listados acima{" "}
              <Forte>mantêm servidores fora do Brasil</Forte>, principalmente
              nos Estados Unidos e na União Europeia. Isso significa que seus
              dados podem ser armazenados e processados no exterior, hipótese
              prevista no art. 33 da LGPD.
            </p>
            <p>
              Essas transferências ocorrem porque são necessárias para
              executar o serviço que você solicitou e para o cumprimento de
              nossas obrigações, e todos os fornecedores oferecem cláusulas
              contratuais de proteção de dados equivalentes às exigidas pela
              legislação brasileira.
            </p>
          </Secao>

          <Secao id="pp-direitos" titulo="Seus direitos">
            <p>
              O art. 18 da LGPD garante a você, a qualquer momento e{" "}
              <Forte>sem custo</Forte>:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>confirmação de que tratamos dados seus;</li>
              <li>acesso aos dados que temos sobre você;</li>
              <li>correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>
                anonimização, bloqueio ou eliminação de dados desnecessários,
                excessivos ou tratados em desconformidade com a lei;
              </li>
              <li>
                portabilidade a outro fornecedor, mediante requisição
                expressa;
              </li>
              <li>
                eliminação dos dados tratados com o seu consentimento;
              </li>
              <li>
                informação sobre com quem compartilhamos seus dados;
              </li>
              <li>
                informação sobre a possibilidade de não consentir e as
                consequências disso;
              </li>
              <li>revogação do consentimento, a qualquer momento.</li>
            </ul>
            <p>
              Para exercer qualquer um deles, escreva para o encarregado no
              e-mail indicado no início desta página. Respondemos em até{" "}
              <Forte>15 dias</Forte>. Podemos pedir uma confirmação de
              identidade antes de atender — é uma proteção sua, para que
              ninguém peça seus dados no seu lugar.
            </p>
            <p>
              Alguns dados podem ser mantidos mesmo após um pedido de
              exclusão, quando houver obrigação legal de guarda (art. 16, I) —
              é o caso dos registros de acesso exigidos pelo Marco Civil da
              Internet.
            </p>
            <p>
              Se você não ficar satisfeito com a nossa resposta, tem o direito
              de reclamar à{" "}
              <Forte>
                ANPD — Autoridade Nacional de Proteção de Dados
              </Forte>{" "}
              (art. 18, §1º), em{" "}
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

          <Secao id="pp-seguranca" titulo="Segurança">
            <p>
              Adotamos as medidas técnicas exigidas pelo art. 46 da LGPD:
              tráfego criptografado (HTTPS), acesso ao painel protegido por
              senha com verificação em duas etapas disponível, senhas
              guardadas apenas como hash, limite de requisições contra abuso e
              acesso aos dados restrito a quem precisa deles para atender
              você.
            </p>
            <p>
              Nenhum sistema é infalível. Se ocorrer um incidente de segurança
              que possa acarretar risco relevante aos seus direitos,
              comunicaremos você e a ANPD em prazo razoável, como determina o
              art. 48.
            </p>
          </Secao>

          <Secao id="pp-criancas" titulo="Crianças e adolescentes">
            <p>
              Este site é destinado a maiores de 18 anos e não coletamos
              intencionalmente dados de crianças ou adolescentes. Se
              identificarmos que um contato foi deixado por menor de idade sem
              o consentimento específico de um dos pais ou responsável (art.
              14 da LGPD), excluiremos o registro.
            </p>
          </Secao>

          <Secao id="pp-alteracoes" titulo="Alterações nesta política">
            <p>
              Podemos atualizar este texto quando mudarmos algo no site ou na
              forma como tratamos dados. A data de atualização no topo sempre
              indica a versão vigente. Mudanças relevantes serão sinalizadas
              na página inicial.
            </p>
          </Secao>

          <Secao id="pp-contato" titulo="Fale com a gente">
            <p>
              Dúvidas sobre esta política ou sobre seus dados:{" "}
              <a
                href={`mailto:${CONTROLADOR.encarregado.email || MARCA.email}`}
                className="underline decoration-black/30 underline-offset-2 hover:decoration-black"
              >
                {CONTROLADOR.encarregado.email || MARCA.email}
              </a>{" "}
              · {MARCA.nome} · CRECI {MARCA.creci} · {CIDADE_UF}.
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
