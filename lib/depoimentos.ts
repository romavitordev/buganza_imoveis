/**
 * Depoimentos exibidos na home — gestão manual: para adicionar, remover
 * ou editar, mexa só neste arquivo (nome, contexto e texto curto).
 *
 * ATENÇÃO: conteúdo fictício de demonstração. Antes do lançamento,
 * substituir por depoimentos reais autorizados pelos clientes.
 */

export interface Depoimento {
  nome: string;
  /** Contexto do negócio — "Comprou apartamento no Campolim". */
  contexto: string;
  texto: string;
}

export const DEPOIMENTOS: Depoimento[] = [
  {
    nome: "Mariana e Felipe",
    contexto: "Compraram apartamento no Campolim",
    texto:
      "Do primeiro contato à entrega das chaves, tudo pelo WhatsApp e sem enrolação. Nos mostraram só imóveis que faziam sentido pra gente — fechamos o segundo que visitamos.",
  },
  {
    nome: "José Carlos",
    contexto: "Vendeu casa no Jardim Europa",
    texto:
      "Tentei vender sozinho por oito meses. Com a Buganza, foram fotos novas, anúncio caprichado e proposta séria em cinco semanas. Negociação transparente do início ao fim.",
  },
  {
    nome: "Ana Paula",
    contexto: "Alugou sala comercial no Centro",
    texto:
      "Precisava de uma sala para o consultório com urgência. Visitei numa quinta, assinei na segunda. Atendimento direto com quem decide faz toda a diferença.",
  },
  {
    nome: "Ricardo",
    contexto: "Comprou terreno no Ibiti",
    texto:
      "Me explicaram cada detalhe do condomínio e da documentação antes mesmo de eu perguntar. Comprei com segurança e já estou com o projeto aprovado.",
  },
  {
    nome: "Família Oliveira",
    contexto: "Comprou casa em Votorantim",
    texto:
      "Procurávamos uma casa maior havia mais de um ano. Eles entenderam o que a gente precisava de verdade — quintal, espaço pra receber — e acharam a casa certa no preço certo.",
  },
  {
    nome: "Camila",
    contexto: "Comprou o primeiro imóvel",
    texto:
      "Primeira compra, mil dúvidas sobre financiamento. Tiveram paciência de explicar tudo, simular parcelas comigo e segurar o imóvel até o banco aprovar. Recomendo de olhos fechados.",
  },
];
