import { Handshake, KeyRound, MapPin, MessageCircle } from "lucide-react";
import { linkWhatsAppGeral } from "@/lib/whatsapp";
import { MARCA } from "@/lib/marca";

/**
 * Seção "Quem Somos" — informações fictícias por enquanto.
 * Este site é o ponto-chave do desenvolvimento da identidade visual
 * da Marcelo Imóveis: paleta preto/branco/cinza, headings leves, pills.
 */

const PILARES = [
  {
    icone: KeyRound,
    titulo: "Atendimento direto",
    texto:
      "Você fala com quem realmente conhece cada imóvel.",
  },
  {
    icone: Handshake,
    titulo: "Sem complicação",
    texto:
      "Da primeira visita à assinatura, cuidamos da burocracia para que comprar ou alugar seja simples de verdade.",
  },
  {
    icone: MapPin,
    titulo: "Sorocaba de ponta a ponta",
    texto:
      "Atuamos nos bairros residenciais e nos principais eixos comerciais da cidade e região.",
  },
];

export default function QuemSomos() {
  return (
    <section
      id="quem-somos"
      aria-labelledby="quem-somos-titulo"
      className="border-t border-black/8 bg-mist/50"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 py-16 md:grid-cols-[2fr_3fr] md:gap-16 md:px-8 md:py-24">
        <div className="bz-fade-up flex flex-col gap-5">
          <p className="flex items-center gap-2 text-[13px] text-secundario">
            <span className="bz-dot" aria-hidden="true" />
            Quem somos
          </p>
          <h2
            id="quem-somos-titulo"
            className="text-3xl leading-tight tracking-tight md:text-4xl"
          >
            Um casal de corretores.
            <br />
            Um jeito mais humano de negociar imóveis.
          </h2>
          {/* Texto dos donos, palavra por palavra. O que estava aqui antes
              era exemplo meu — ver RESPOSTAS-CLIENTE.txt. */}
          <p className="text-[15px] leading-relaxed text-secundario">
            Há 15 anos, a {MARCA.nome} nasceu com o propósito de transformar a
            experiência de comprar, vender ou alugar um imóvel em algo mais
            seguro, transparente e personalizado.
          </p>
          <p className="text-[15px] leading-relaxed text-secundario">
            Escolhemos o mercado imobiliário porque acreditamos que um imóvel
            não é apenas um patrimônio: é o lugar onde histórias começam,
            famílias crescem e novos projetos de vida acontecem.
          </p>
          <p className="text-[15px] leading-relaxed text-secundario">
            Ao longo dessa trajetória, construímos nosso trabalho com base em
            atendimento próximo, confiança e conhecimento do mercado de{" "}
            {MARCA.cidade}. Aqui, cada cliente é tratado como único, porque
            entendemos que cada pessoa tem necessidades, sonhos e objetivos
            diferentes.
          </p>
          <p className="text-[15px] leading-relaxed text-secundario">
            Nosso diferencial está justamente nesse atendimento personalizado:
            ouvimos, entendemos e buscamos as melhores soluções imobiliárias
            para cada cliente, acompanhando cada etapa da negociação com
            dedicação e responsabilidade.
          </p>
          <p className="text-[15px] leading-relaxed text-secundario">
            São 15 anos de experiência, relacionamento e compromisso, sempre
            colocando as pessoas em primeiro lugar.
          </p>
          {/* Este parágrafo quase se perdeu: no documento, eles NÃO
              reescreveram a frase inteira — mantiveram a primeira metade
              (que era minha, em preto) e trocaram só o final, em
              vermelho. Ao substituir o bloco antigo pela história nova,
              a metade preservada foi junto. Só apareceu ao ler o
              documento por COR, e não por texto. */}
          <p className="text-[15px] leading-relaxed text-secundario">
            Trabalhamos com um catálogo enxuto e escolhido a dedo, buscamos
            entender a real necessidade do cliente para melhor atendê-lo.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <a
              href={linkWhatsAppGeral()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-pill bg-black px-6 py-3 text-[13px] font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
            >
              <MessageCircle
                size={15}
                strokeWidth={2.5}
                aria-hidden="true"
              />
              Conversar com a gente
            </a>
            <span className="text-[12px] md:text-[11px] text-secundario">
              CRECI {MARCA.creci}
            </span>
          </div>

          {/* Eram três números. O "+400 imóveis negociados" saiu porque
              era projeção minha, e os donos mandaram excluir — número de
              prova social que ninguém consegue provar é o tipo de coisa
              que um concorrente cobra depois. Os dois que ficaram vieram
              deles.

              Duas colunas, e não três com um buraco: grid-cols-2 com o
              conteúdo à esquerda mantém o alinhamento com o texto acima. */}
          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-black/10 pt-6">
            {[
              { numero: "+15", rotulo: "anos de mercado" },
              { numero: "100%", rotulo: "acompanhamento pessoal" },
            ].map(({ numero, rotulo }) => (
              <div key={rotulo}>
                <dt className="sr-only">{rotulo}</dt>
                <dd className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {numero}
                </dd>
                <dd className="mt-0.5 text-[12px] md:text-[11px] leading-snug text-secundario">
                  {rotulo}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-1 content-center gap-4 sm:grid-cols-1">
          {PILARES.map(({ icone: Icone, titulo, texto }, i) => (
            <div
              key={titulo}
              className="bz-fade-up group flex gap-4 rounded-2xl border border-black/8 bg-white p-6 transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-black/20 hover:shadow-[0_18px_44px_rgba(0,0,0,0.09)]"
              style={{ animationDelay: `${0.1 + i * 0.12}s` }}
            >
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-transparent bg-black text-white transition-all duration-300 ease-premium group-hover:scale-105 group-hover:border-black group-hover:bg-white group-hover:text-black">
                <Icone
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="transition-transform duration-300 ease-premium group-hover:-rotate-6"
                />
              </span>
              <div>
                <h3 className="mb-1 text-base font-medium tracking-tight">
                  {titulo}
                </h3>
                <p className="text-[13px] leading-relaxed text-secundario">
                  {texto}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
