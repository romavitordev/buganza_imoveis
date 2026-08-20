import { describe, expect, it } from "vitest";
import { responder, respostaDoTopico, TOPICOS } from "@/lib/chatbot";

describe("chatbot — casamento de tópicos", () => {
  it("reconhece intenção de agendar visita", () => {
    const r = responder("gostaria de agendar uma visita");
    expect(r.encontrou).toBe(true);
    expect(r.topicoId).toBe("visita");
  });

  it("ignora acentos e caixa (financiamento)", () => {
    expect(responder("posso FINANCIAR pelo banco?").topicoId).toBe(
      "financiamento"
    );
    expect(responder("uso do fgts").topicoId).toBe("financiamento");
  });

  it("entende documentos de locação", () => {
    expect(responder("que documentos preciso pra alugar").topicoId).toBe(
      "documentos"
    );
  });

  it("entende intenção de anunciar/vender", () => {
    expect(responder("quero vender meu apartamento").topicoId).toBe(
      "anunciar"
    );
  });

  it("responde sobre cidades atendidas", () => {
    expect(responder("vocês atendem em votorantim?").topicoId).toBe("cidades");
  });

  it("cai no fallback quando não sabe (sem inventar)", () => {
    const r = responder("qual a cor favorita do corretor?");
    expect(r.encontrou).toBe(false);
    expect(r.texto.toLowerCase()).toContain("whatsapp");
  });

  it("texto vazio → fallback", () => {
    expect(responder("   ").encontrou).toBe(false);
  });

  it("respostaDoTopico devolve o texto do chip", () => {
    for (const t of TOPICOS) {
      const r = respostaDoTopico(t.id);
      expect(r.encontrou).toBe(true);
      expect(r.texto).toBe(t.resposta);
    }
    expect(respostaDoTopico("inexistente").encontrou).toBe(false);
  });
});

describe("tolerância a erro de digitação (B3)", () => {
  it("acha financiamento mesmo escrito errado", () => {
    expect(responder("como funciona o financiamneto?").topicoId).toBe("financiamento");
    expect(responder("quero финансиar").encontrou).toBeDefined(); // não explode com unicode
  });

  it("acha aluguel com typo leve", () => {
    expect(responder("documentos para alugel").topicoId).toBe("documentos");
  });

  it("palavra curta não vira fuzzy (casa != caso)", () => {
    // "caso" não deve casar com nada via "casa"
    expect(responder("em todo caso obrigado").encontrou).toBe(false);
  });
});

describe("tópicos novos (B3)", () => {
  it("responde ITBI/escritura", () => {
    expect(responder("quanto pago de itbi?").topicoId).toBe("docs-compra");
    expect(responder("como funciona a escritura").topicoId).toBe("docs-compra");
  });
  it("responde garantias do aluguel", () => {
    expect(responder("precisa de fiador?").topicoId).toBe("garantias");
    expect(responder("aceita seguro fiança?").topicoId).toBe("garantias");
  });
  it("responde permuta", () => {
    expect(responder("aceita permuta por outro imovel?").topicoId).toBe("permuta");
  });
  it("responde avaliação", () => {
    expect(responder("quanto vale meu imóvel?").topicoId).toBe("avaliacao");
  });
});

/**
 * SAUDAÇÕES.
 *
 * "oi, tudo bem?" — a abertura mais comum que existe — caía no fallback:
 * o robô respondia "não sei responder" para um cumprimento, e a frase
 * ainda entrava na fila de perguntas sem resposta do painel. A checagem
 * comparava o texto INTEIRO contra uma saudação só, e "oi tudo bem" não
 * é igual nem parecido com "tudo bem".
 *
 * O par de blocos abaixo é o que segura a correção: um cobre o
 * cumprimento puro, o outro garante que a tolerância não engoliu
 * pergunta de verdade. Sem o segundo, seria fácil "consertar" aceitando
 * qualquer frase que comece com "oi".
 */
describe("saudações", () => {
  const soCumprimento = [
    "Olá", "oi", "Oi!", "opa", "e aí", "bom dia", "Boa tarde", "boa noite",
    "tudo bem", "tudo bem?", "oi, tudo bem?", "olá, tudo bem?",
    "oi bom dia tudo bem", "ola", "oii",
  ];
  it.each(soCumprimento)("responde a %s sem cair no fallback", (texto) => {
    const r = responder(texto);
    expect(r.encontrou).toBe(true);
    expect(r.topicoId).toBe("saudacao");
  });

  const temPerguntaDentro: [string, string][] = [
    ["oi, quanto custa anunciar?", "precos"],
    ["bom dia, quero agendar visita", "visita"],
    ["oi tudo bem? queria saber do financiamento", "financiamento"],
    ["e aí, aceita permuta?", "permuta"],
    ["boa tarde, quais documentos?", "documentos"],
  ];
  it.each(temPerguntaDentro)(
    "%s vai para o tópico, e não para a saudação",
    (texto, topico) => {
      const r = responder(texto);
      expect(r.topicoId).toBe(topico);
    }
  );
});

/**
 * SAUDAÇÃO ESPELHADA.
 *
 * Responder "Olá!" a quem escreveu "boa noite" é o detalhe que denuncia
 * o robô — qualquer atendente devolve o mesmo cumprimento. Os três
 * períodos do dia têm espelho; o resto ("oi", "opa", "tudo bem") não tem
 * equivalente natural e cai no "Olá!".
 */
describe("saudação espelhada", () => {
  const espelhados: [string, string][] = [
    ["bom dia", "Bom dia!"],
    ["Bom dia!", "Bom dia!"],
    ["boa tarde", "Boa tarde!"],
    ["Boa noite", "Boa noite!"],
    ["boa noite, tudo bem?", "Boa noite!"],
    ["oi bom dia", "Bom dia!"],
  ];
  it.each(espelhados)("%s → começa com %s", (entrada, inicio) => {
    expect(responder(entrada).texto.startsWith(inicio)).toBe(true);
  });

  const genericos = ["oi", "olá", "opa", "e aí", "tudo bem?", "oii"];
  it.each(genericos)("%s → começa com Olá!", (entrada) => {
    expect(responder(entrada).texto.startsWith("Olá!")).toBe(true);
  });
});
