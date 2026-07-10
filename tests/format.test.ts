import { describe, expect, it } from "vitest";
import {
  formatarPreco,
  precoLocacaoFormatado,
  precoPrincipal,
  precoSecundario,
} from "@/lib/format";

describe("formatarPreco", () => {
  it("formata reais sem centavos", () => {
    // \s cobre o espaço não separável (U+00A0) do Intl pt-BR
    expect(formatarPreco("750000.00")).toMatch(/^R\$\s?750\.000$/);
  });

  it("devolve null para vazio, null, zero e valores inválidos", () => {
    expect(formatarPreco(null)).toBeNull();
    expect(formatarPreco("")).toBeNull();
    expect(formatarPreco("0")).toBeNull();
    expect(formatarPreco("-100")).toBeNull();
    expect(formatarPreco("abc")).toBeNull();
  });
});

describe("preço principal e secundário", () => {
  it("venda tem prioridade; locação vira secundário com /mês", () => {
    const ambos = { precoVenda: "500000", precoLocacao: "2200" };
    expect(precoPrincipal(ambos)).toMatch(/500\.000/);
    expect(precoSecundario(ambos)).toMatch(/2\.200\/mês$/);
  });

  it("só locação: vira o principal, com sufixo /mês", () => {
    const soLocacao = { precoVenda: null, precoLocacao: "1800" };
    expect(precoPrincipal(soLocacao)).toMatch(/1\.800\/mês$/);
    expect(precoSecundario(soLocacao)).toBeNull();
  });

  it("nenhum preço: null (a UI mostra 'Sob consulta')", () => {
    const nenhum = { precoVenda: null, precoLocacao: null };
    expect(precoPrincipal(nenhum)).toBeNull();
    expect(precoLocacaoFormatado(nenhum)).toBeNull();
  });
});
