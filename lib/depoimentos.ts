import { MARCA } from "@/lib/marca";

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

/**
 * VAZIO DE PROPÓSITO — a seção some da home enquanto estiver assim.
 *
 * Os sete depoimentos que existiam aqui eram INVENTADOS por mim, como
 * exemplo. Publicar depoimento falso no site de uma imobiliária de
 * verdade é propaganda enganosa, e os donos escolheram tirar a seção do
 * ar até terem os reais.
 *
 * Eles já identificaram cinco clientes que vão depor — Sr. Alceu,
 * Carolina, Fábio Trix, Érica Fit e Luiz —, mas as FALAS ainda não
 * chegaram. Assim que chegarem, é só preencher aqui: a seção volta
 * sozinha, sem mexer em componente nenhum.
 *
 * Cada item precisa de nome, contexto ("Comprou apartamento no
 * Campolim") e o texto do que a pessoa falou — com autorização dela.
 */
export const DEPOIMENTOS: Depoimento[] = [];
