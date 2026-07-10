/**
 * Normalização de preço digitado — compartilhada entre o servidor
 * (lib/property-input.ts) e o form do admin (preview ao vivo).
 * NÃO importa Prisma: precisa rodar no navegador.
 *
 * Aceita pt-BR ("550.000", "1.234,56", "R$ 2.500") E decimal de API
 * ("2200.50") — o form de edição reenvia o valor como a API devolveu,
 * então tratar ponto sempre como milhar corrompia preços com centavos.
 */

/** Teto de sanidade: R$ 1 bilhão. */
export const PRECO_MAXIMO = 1_000_000_000;

/** Converte texto/número em valor numérico, ou null se vazio/inválido. */
export function normalizarPreco(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  let numero: number;
  if (typeof value === "number") {
    numero = value;
  } else {
    const bruto = String(value).replace(/[R$\s]/g, "");
    let normalizado: string;
    if (bruto.includes(",")) {
      // Tem vírgula → formato pt-BR: pontos são milhar, vírgula é decimal
      normalizado = bruto.replace(/\./g, "").replace(",", ".");
    } else if (
      (bruto.match(/\./g) ?? []).length === 1 &&
      /\.\d{1,2}$/.test(bruto)
    ) {
      // Ponto único com 1–2 dígitos no fim = separador decimal ("2200.50")
      normalizado = bruto;
    } else {
      // Pontos como milhar ("550.000", "1.234.567") ou sem pontos
      normalizado = bruto.replace(/\./g, "");
    }
    numero = Number(normalizado);
  }

  if (!Number.isFinite(numero) || numero < 0 || numero > PRECO_MAXIMO) {
    return Number.NaN; // sinaliza inválido (diferente de vazio = null)
  }
  return numero;
}

/** Preview formatado para o form: "R$ 2.200,50", ou null se vazio/inválido. */
export function previewPreco(texto: string): string | null {
  const numero = normalizarPreco(texto);
  if (numero === null || Number.isNaN(numero) || numero === 0) return null;
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: numero % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
