import { describe, expect, it } from "vitest";
import {
  extrairBusca,
  queryDaBusca,
  urlCatalogoDaBusca,
} from "@/lib/chatbot-busca";

describe("extrairBusca", () => {
  it("entende 'apartamento 3 quartos até 500 mil'", () => {
    const b = extrairBusca("apartamento 3 quartos até 500 mil");
    expect(b).not.toBeNull();
    expect(b?.subtipo).toBe("APARTAMENTO");
    expect(b?.quartosMin).toBe(3);
    expect(b?.precoMax).toBe(500_000);
  });

  it("entende locação com valor pequeno: 'alugar casa até 2.500'", () => {
    const b = extrairBusca("quero alugar uma casa até 2.500");
    expect(b?.subtipo).toBe("CASA");
    expect(b?.transacao).toBe("LOCACAO");
    expect(b?.precoMax).toBe(2_500);
  });

  it("entende milhão com vírgula: 'casa até 1,5 milhão'", () => {
    const b = extrairBusca("casa até 1,5 milhão");
    expect(b?.precoMax).toBe(1_500_000);
  });

  it("entende vagas e comprar: 'comprar sobrado 2 vagas'", () => {
    const b = extrairBusca("comprar sobrado com 2 vagas");
    expect(b?.subtipo).toBe("SOBRADO");
    expect(b?.transacao).toBe("VENDA");
    expect(b?.vagasMin).toBe(2);
  });

  it("terreno e comercial viram tipo, não subtipo", () => {
    expect(extrairBusca("terreno para comprar")?.tipo).toBe("TERRENO");
    expect(extrairBusca("procuro uma loja")?.tipo).toBe("COMERCIAL");
  });

  it("NÃO dispara sem atributo concreto (anti-sequestro de tópicos)", () => {
    // "alugar" sozinho é assunto de documentos, não busca
    expect(extrairBusca("documentos para alugar")).toBeNull();
    expect(extrairBusca("como funciona o financiamento?")).toBeNull();
    expect(extrairBusca("quero visitar")).toBeNull();
    expect(extrairBusca("")).toBeNull();
  });

  it("ignora número pequeno como preço ('até 3' não é R$ 3)", () => {
    const b = extrairBusca("apartamento até 3 quartos");
    expect(b?.precoMax).toBeUndefined();
    expect(b?.quartosMin).toBe(3);
  });
});

describe("queryDaBusca / urlCatalogoDaBusca", () => {
  it("monta a query da API com limit", () => {
    const b = extrairBusca("apartamento 3 quartos até 500 mil")!;
    const qs = new URLSearchParams(queryDaBusca(b));
    expect(qs.get("subtipo")).toBe("APARTAMENTO");
    expect(qs.get("quartosMin")).toBe("3");
    expect(qs.get("precoMax")).toBe("500000");
    expect(qs.get("limit")).toBe("4");
  });

  it("monta a URL do catálogo com os params que a página aceita", () => {
    const b = extrairBusca("alugar apartamento 2 quartos até 3 mil")!;
    const url = urlCatalogoDaBusca(b);
    expect(url).toContain("/imoveis?");
    expect(url).toContain("transacao=LOCACAO");
    expect(url).toContain("quartos=2");
    expect(url).toContain("precoMax=3000");
    // catálogo não tem filtro de subtipo — vira busca textual
    expect(url).toContain("q=apartamento");
  });
});
