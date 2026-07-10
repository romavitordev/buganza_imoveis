import { describe, expect, it } from "vitest";
import { isValidationError, parsePropertyInput } from "@/lib/property-input";

function payloadBase(extra: Record<string, unknown> = {}) {
  return {
    titulo: "Casa de teste válida",
    descricao: "Descrição longa o bastante.",
    tipo: "RESIDENCIAL",
    transacao: "VENDA",
    status: "ATIVO",
    destaque: false,
    cidade: "Sorocaba",
    bairro: "Centro",
    ...extra,
  };
}

function precoVendaDe(payload: Record<string, unknown>): string | null {
  const input = parsePropertyInput(payload);
  if (isValidationError(input)) throw new Error(input.erro);
  return input.precoVenda?.toString() ?? null;
}

describe("parse de preços (regressão do bug ×100)", () => {
  it("formato decimal de API: '2200.50' é R$ 2.200,50 — NÃO 220050", () => {
    expect(precoVendaDe(payloadBase({ precoVenda: "2200.50" }))).toBe("2200.5");
  });

  it("round-trip do form: '2200.5' mantém o valor", () => {
    expect(precoVendaDe(payloadBase({ precoVenda: "2200.5" }))).toBe("2200.5");
  });

  it("pt-BR com milhar: '550.000' é 550000", () => {
    expect(precoVendaDe(payloadBase({ precoVenda: "550.000" }))).toBe("550000");
  });

  it("pt-BR completo: 'R$ 1.234.567,89'", () => {
    expect(precoVendaDe(payloadBase({ precoVenda: "R$ 1.234.567,89" }))).toBe(
      "1234567.89"
    );
  });

  it("vírgula decimal simples: '1800,50'", () => {
    expect(precoVendaDe(payloadBase({ precoVenda: "1800,50" }))).toBe("1800.5");
  });

  it("número puro e string sem separador", () => {
    expect(precoVendaDe(payloadBase({ precoVenda: 750000 }))).toBe("750000");
    expect(precoVendaDe(payloadBase({ precoVenda: "750000" }))).toBe("750000");
  });

  it("vazio/null viram null (sob consulta)", () => {
    expect(precoVendaDe(payloadBase({ precoVenda: "" }))).toBeNull();
    expect(precoVendaDe(payloadBase({ precoVenda: null }))).toBeNull();
  });

  it("rejeita lixo e valores absurdos (> R$ 1 bi)", () => {
    for (const invalido of ["abc", "-100", "2000000000"]) {
      const input = parsePropertyInput(payloadBase({ precoVenda: invalido }));
      expect(isValidationError(input)).toBe(true);
    }
  });
});

describe("validação básica", () => {
  it("exige título ≥ 5 chars e descrição ≥ 10", () => {
    expect(
      isValidationError(parsePropertyInput(payloadBase({ titulo: "Oi" })))
    ).toBe(true);
    expect(
      isValidationError(parsePropertyInput(payloadBase({ descricao: "curta" })))
    ).toBe(true);
  });

  it("rejeita enum inválido", () => {
    expect(
      isValidationError(parsePropertyInput(payloadBase({ tipo: "CASTELO" })))
    ).toBe(true);
  });

  it("payload válido passa", () => {
    expect(isValidationError(parsePropertyInput(payloadBase()))).toBe(false);
  });
});
