import type { PublicPropertyDTO } from "@/lib/dto";

/**
 * Ranqueia imóveis por semelhança com o imóvel de referência, para a
 * seção "Imóveis parecidos" do detalhe. Recebe candidatos já vindos do
 * banco (mesma cidade, ATIVOS, exceto o próprio) e ordena por afinidade.
 *
 * Pontuação (maior = mais parecido):
 *   +4  mesmo subtipo (Casa≈Casa)  |  senão +2 mesmo tipo
 *   +3  transação compatível (mesma, ou um dos lados de VENDA_LOCACAO)
 *   +2  mesmo bairro
 *   +2  mesma faixa de quartos
 *   +0..3  proximidade de preço (quanto mais perto, mais pontos)
 */
export function ranquearSemelhantes(
  referencia: PublicPropertyDTO,
  candidatos: PublicPropertyDTO[],
  limite = 3
): PublicPropertyDTO[] {
  const precoRef = precoBase(referencia);

  const pontuados = candidatos
    .filter((c) => c.id !== referencia.id)
    .map((c) => {
      let score = 0;

      if (c.subtipo && c.subtipo === referencia.subtipo) score += 4;
      else if (c.tipo === referencia.tipo) score += 2;

      if (transacaoCompativel(referencia.transacao, c.transacao)) score += 3;
      if (c.bairro === referencia.bairro) score += 2;

      if (
        referencia.quartos !== null &&
        c.quartos !== null &&
        referencia.quartos === c.quartos
      ) {
        score += 2;
      }

      // Proximidade de preço: 0 a 3 pontos conforme a diferença relativa
      const precoC = precoBase(c);
      if (precoRef !== null && precoC !== null) {
        const dif = Math.abs(precoC - precoRef) / precoRef;
        if (dif <= 0.15) score += 3;
        else if (dif <= 0.35) score += 2;
        else if (dif <= 0.6) score += 1;
      }

      return { imovel: c, score, precoC };
    });

  pontuados.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Empate: mais recente primeiro (candidatos já vêm ordenados por data)
    return 0;
  });

  return pontuados.slice(0, limite).map((p) => p.imovel);
}

/** Preço de referência: venda, senão locação; null se ambos ausentes. */
function precoBase(imovel: PublicPropertyDTO): number | null {
  const valor = Number(imovel.precoVenda ?? imovel.precoLocacao);
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

/** VENDA_LOCACAO casa com qualquer lado; senão precisa ser igual. */
function transacaoCompativel(
  a: PublicPropertyDTO["transacao"],
  b: PublicPropertyDTO["transacao"]
): boolean {
  if (a === b) return true;
  return a === "VENDA_LOCACAO" || b === "VENDA_LOCACAO";
}
