import { MARCA } from "@/lib/marca";

/**
 * Depoimentos exibidos na home — gestão manual: para adicionar, remover
 * ou editar, mexa só neste arquivo (nome, contexto e texto).
 *
 * A lista já esteve VAZIA de propósito, enquanto os sete depoimentos que
 * existiam aqui eram inventados por mim como exemplo. Publicar
 * depoimento falso no site de uma imobiliária de verdade é propaganda
 * enganosa, então a seção ficou fora do ar até chegarem os reais — ela
 * some sozinha com a lista vazia (Depoimentos.tsx devolve null).
 *
 * Os três abaixo são REAIS, enviados pelos donos em 07/09/2026.
 */

export interface Depoimento {
  nome: string;
  /** Contexto do negócio — "Comprou apartamento no Campolim". */
  contexto: string;
  texto: string;
}

/**
 * REGRA AO EDITAR: o `texto` é a palavra da pessoa, não texto do site.
 *
 * Não reescreva, não "melhore" e não corrija estilo — nem quando soar
 * repetitivo ao lado do nome (a Sandra começa se apresentando, e isso
 * fica). Depoimento é declaração de terceiro: alterar o que a pessoa
 * disse descaracteriza a autorização que ela deu.
 *
 * O que é nosso, e pode ser ajustado à vontade, é o `contexto`.
 */
export const DEPOIMENTOS: Depoimento[] = [
  {
    nome: "Érica Acosta",
    contexto: "Vendeu a casa em permuta por apartamento",
    texto:
      "Conheci a Marina e o Marcelo quando perdi meu pai, e precisávamos " +
      "vender a casa, desde então nunca mais os abandonei rs. Hoje eles " +
      "administram um imóvel nosso e mais que corretores tornaram-se " +
      "amigos da família.",
  },
  {
    nome: "Sandra Acosta",
    contexto: "Vendeu a casa em permuta por apartamento",
    texto:
      "Sou a Sandra, falar dos corretores Marina e Marcelo é extremamente " +
      "agradável, pessoas atenciosas, competentes, totalmente confiáveis e " +
      "amigos pra vida. Os encontrei num momento muito difícil da minha " +
      "vida, onde vivia um luto. Eles conseguiram vender meu imóvel " +
      "rapidamente, com preço justo, e a compra de um outro, me " +
      "proporcionando segurança e conforto. Recomendo muito eles como " +
      "corretores.",
  },
  {
    nome: "Amanda Carrijo",
    contexto: `Aluga um apartamento administrado pela ${MARCA.nome}`,
    texto:
      "Marina é uma excelente profissional. Solícita, prática, sempre " +
      "disposta a dialogar e encontrar a melhor solução pro seu cliente. " +
      "Tive problemas no condomínio e ela me ajudou a resolver todos. " +
      "Extremamente ética. Indico de olhos fechados.",
  },
];
