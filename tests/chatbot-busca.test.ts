import { describe, expect, it } from "vitest";
import {
  extrairBusca,
  extrairContinuacao,
  mesclarBusca,
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

describe("preço mínimo, faixa e formas soltas (correções)", () => {
  it("entende 'por mais de 550 mil' como preço MÍNIMO", () => {
    const b = extrairBusca("apartamento de 2 quartos por mais de 550 mil")!;
    expect(b.precoMin).toBe(550_000);
    expect(b.precoMax).toBeUndefined();
    expect(b.quartosMin).toBe(2);
    expect(b.resumo).toContain("acima de 550.000");
  });

  it("entende 'acima de' e 'a partir de'", () => {
    expect(extrairBusca("casa acima de 400 mil")?.precoMin).toBe(400_000);
    expect(extrairBusca("casa a partir de r$ 300.000")?.precoMin).toBe(300_000);
  });

  it("entende faixa 'entre 300 e 500 mil' (unidade herdada)", () => {
    const b = extrairBusca("apartamento entre 300 e 500 mil")!;
    expect(b.precoMin).toBe(300_000);
    expect(b.precoMax).toBe(500_000);
  });

  it("entende faixa 'de 300 a 500 mil'", () => {
    const b = extrairBusca("casa de 300 a 500 mil")!;
    expect(b.precoMin).toBe(300_000);
    expect(b.precoMax).toBe(500_000);
  });

  it("'de 2 a 3 quartos' NAO vira faixa de preco", () => {
    const b = extrairBusca("apartamento de 2 a 3 quartos")!;
    expect(b.precoMin).toBeUndefined();
    expect(b.precoMax).toBeUndefined();
    expect(b.quartosMin).toBe(2);
  });

  it("valor solto com unidade vira teto: 'apartamento 550 mil'", () => {
    expect(extrairBusca("apartamento 550 mil")?.precoMax).toBe(550_000);
  });

  it("numeros por extenso: 'dois quartos', 'duas vagas'", () => {
    const b = extrairBusca("casa com dois quartos e duas vagas")!;
    expect(b.quartosMin).toBe(2);
    expect(b.vagasMin).toBe(2);
  });
});

describe("continuidade da conversa", () => {
  it("extrairContinuacao aceita so o preco ('e por mais de 550 mil?')", () => {
    const c = extrairContinuacao("e por mais de 550 mil?")!;
    expect(c.precoMin).toBe(550_000);
  });

  it("extrairContinuacao aceita so a transacao ('e para alugar?')", () => {
    expect(extrairContinuacao("e para alugar?")?.transacao).toBe("LOCACAO");
  });

  it("extrairContinuacao devolve null sem nenhum filtro", () => {
    expect(extrairContinuacao("obrigado!")).toBeNull();
  });

  it("mesclarBusca: preco novo substitui a faixa antiga EM BLOCO", () => {
    const anterior = extrairBusca("apartamento 2 quartos por menos de 550 mil")!;
    const nova = extrairContinuacao("e por mais de 550 mil?")!;
    const m = mesclarBusca(anterior, nova);
    expect(m.subtipo).toBe("APARTAMENTO");
    expect(m.quartosMin).toBe(2);
    expect(m.precoMin).toBe(550_000);
    expect(m.precoMax).toBeUndefined(); // o "menos de" antigo sumiu
    expect(m.resumo).toContain("acima de 550.000");
  });

  it("mesclarBusca: transacao nova mantem o resto", () => {
    const anterior = extrairBusca("casa 3 quartos até 400 mil")!;
    const nova = extrairContinuacao("e para alugar?")!;
    const m = mesclarBusca(anterior, nova);
    expect(m.transacao).toBe("LOCACAO");
    expect(m.subtipo).toBe("CASA");
    expect(m.precoMax).toBe(400_000);
  });
});

// Espelha os bairros reais do catálogo, inclusive a ambiguidade
// "Campolim" x "Parque Campolim" e um bairro com prefixo que também é
// um tipo de imóvel ("Chácara …").
const LUGARES = {
  bairros: [
    "Campolim",
    "Parque Campolim",
    "Jardim Europa",
    "Vila Josefina",
    "Centro",
    "Chácara Recreio",
  ],
  cidades: ["Sorocaba", "Votorantim"],
};

describe("filtro por bairro/cidade", () => {
  it("reconhece o bairro e mantém o tipo do imóvel", () => {
    const b = extrairBusca("apartamento no Campolim", LUGARES)!;
    expect(b.bairro).toBe("Campolim");
    expect(b.subtipo).toBe("APARTAMENTO");
    expect(b.resumo).toContain("em Campolim");
  });

  it("nome mais específico vence: 'Parque Campolim' > 'Campolim'", () => {
    expect(extrairBusca("apartamento no Parque Campolim", LUGARES)?.bairro).toBe(
      "Parque Campolim"
    );
  });

  it("aceita só a parte distintiva ('na Europa' → Jardim Europa)", () => {
    expect(extrairBusca("casa na Europa", LUGARES)?.bairro).toBe("Jardim Europa");
    expect(extrairBusca("sala na Josefina", LUGARES)?.bairro).toBe("Vila Josefina");
  });

  it("bairro que parece tipo de imóvel NÃO vira subtipo", () => {
    const b = extrairBusca("apartamento na Chácara Recreio", LUGARES)!;
    expect(b.bairro).toBe("Chácara Recreio");
    expect(b.subtipo).toBe("APARTAMENTO"); // e não CHACARA
  });

  it("palavra genérica sozinha não vira bairro", () => {
    expect(extrairBusca("casa com parque perto", LUGARES)?.bairro).toBeUndefined();
    expect(extrairBusca("casa com jardim", LUGARES)?.bairro).toBeUndefined();
  });

  it("casa por palavra inteira: 'encontro' não vira o bairro Centro", () => {
    expect(extrairBusca("marcar um encontro", LUGARES)).toBeNull();
    expect(extrairBusca("sala comercial no Centro", LUGARES)?.bairro).toBe("Centro");
  });

  it("reconhece a cidade quando não há bairro", () => {
    const b = extrairBusca("casa em Votorantim", LUGARES)!;
    expect(b.cidade).toBe("Votorantim");
    expect(b.bairro).toBeUndefined();
  });

  it("bairro sozinho já dispara a busca", () => {
    const b = extrairBusca("tem algo no Jardim Europa?", LUGARES);
    expect(b?.bairro).toBe("Jardim Europa");
  });

  it("sem a lista de lugares, nada de bairro (degrada sem quebrar)", () => {
    const b = extrairBusca("apartamento no Campolim")!;
    expect(b.bairro).toBeUndefined();
    expect(b.subtipo).toBe("APARTAMENTO");
  });

  it("continuação troca só o bairro e mantém o resto", () => {
    const anterior = extrairBusca("apartamento 2 quartos até 600 mil", LUGARES)!;
    const nova = extrairContinuacao("e no Centro?", LUGARES)!;
    const m = mesclarBusca(anterior, nova);
    expect(m.bairro).toBe("Centro");
    expect(m.subtipo).toBe("APARTAMENTO");
    expect(m.quartosMin).toBe(2);
    expect(m.precoMax).toBe(600_000);
    expect(m.resumo).toContain("em Centro");
  });

  it("bairro entra na query da API e na URL do catálogo", () => {
    const b = extrairBusca("apartamento no Campolim", LUGARES)!;
    expect(new URLSearchParams(queryDaBusca(b)).get("bairro")).toBe("Campolim");
    expect(urlCatalogoDaBusca(b)).toContain("bairro=Campolim");
  });
});

describe("troca de espécie do imóvel (não herda o tipo antigo)", () => {
  it("pedir 'sala comercial' depois de 'casa' NÃO mantém subtipo CASA", () => {
    const anterior = extrairBusca("casa no Campolim", LUGARES)!;
    expect(anterior.subtipo).toBe("CASA");
    const nova = extrairContinuacao("sala comercial no Centro", LUGARES)!;
    const m = mesclarBusca(anterior, nova);
    expect(m.tipo).toBe("COMERCIAL");
    expect(m.subtipo).toBeUndefined();
    expect(m.bairro).toBe("Centro");
  });

  it("refinamento sem espécie mantém a espécie anterior", () => {
    const anterior = extrairBusca("casa até 800 mil", LUGARES)!;
    const nova = extrairContinuacao("e no Jardim Europa?", LUGARES)!;
    const m = mesclarBusca(anterior, nova);
    expect(m.subtipo).toBe("CASA");
    expect(m.bairro).toBe("Jardim Europa");
    expect(m.precoMax).toBe(800_000);
  });
});
