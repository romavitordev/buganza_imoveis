/** Formatação de preços em pt-BR. */

export function formatarPreco(valor: string | number | null): string | null {
  if (valor === null || valor === "") return null;
  const numero = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) return null;
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export interface PrecosImovel {
  precoVenda: string | null;
  precoLocacao: string | null;
}

/**
 * Linha principal de preço de um imóvel:
 *  - venda:    "R$ 750.000"
 *  - locação:  "R$ 2.200/mês"
 *  - ambos:    venda como principal, locação como secundária
 *  - nenhum:   null (exibir "Sob consulta")
 */
export function precoPrincipal(p: PrecosImovel): string | null {
  return formatarPreco(p.precoVenda) ?? precoLocacaoFormatado(p);
}

export function precoLocacaoFormatado(p: PrecosImovel): string | null {
  const valor = formatarPreco(p.precoLocacao);
  return valor ? `${valor}/mês` : null;
}

/** Preço secundário quando o imóvel tem venda E locação. */
export function precoSecundario(p: PrecosImovel): string | null {
  if (!formatarPreco(p.precoVenda)) return null;
  return precoLocacaoFormatado(p);
}
