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
