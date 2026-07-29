import { describe, expect, it } from "vitest";
import { palavrasChaveDe } from "@/lib/chatbot-aprendizado";
import { responder, type TopicoAprendido } from "@/lib/chatbot";

describe("palavrasChaveDe", () => {
  it("usa o que o corretor digitou, normalizado", () => {
    expect(palavrasChaveDe("Condomínio, Síndico ", "Qualquer título")).toEqual([
      "condominio",
      "sindico",
    ]);
  });

  it("aceita expressão de duas palavras", () => {
    expect(palavrasChaveDe("administracao de condominio", "x")).toEqual([
      "administracao de condominio",
    ]);
  });

  it("sem palavras informadas, extrai do título ignorando palavras comuns", () => {
    const chaves = palavrasChaveDe("", "Vocês fazem administração de condomínio?");
    expect(chaves).toContain("administracao");
    expect(chaves).toContain("condominio");
    expect(chaves).not.toContain("voces"); // palavra comum
    expect(chaves).not.toContain("de");
  });

  it("descarta fragmentos curtos demais", () => {
    expect(palavrasChaveDe("ab, xy", "")).toEqual([]);
  });
});

describe("respostas ensinadas no painel", () => {
  const aprendidos: TopicoAprendido[] = [
    {
      id: "k1",
      titulo: "Administração de condomínio",
      chaves: ["administracao de condominio", "sindico"],
      resposta: "Sim, cuidamos da administração de condomínios.",
    },
  ];

  it("o bot responde com o que foi ensinado", () => {
    const r = responder("voces fazem administracao de condominio?", aprendidos);
    expect(r.encontrou).toBe(true);
    expect(r.texto).toContain("administração de condomínios");
    expect(r.topicoId).toBe("k1");
  });

  it("sem a base aprendida, a mesma pergunta cai no fallback", () => {
    expect(responder("voces fazem administracao de condominio?").encontrou).toBe(false);
  });

  it("não atrapalha os tópicos fixos", () => {
    expect(responder("como funciona o financiamento?", aprendidos).topicoId).toBe(
      "financiamento"
    );
  });
});

describe("saudações não viram 'não sei responder'", () => {
  it("reconhece cumprimentos e erros de digitação neles", () => {
    for (const s of ["ola", "Olá", "ols", "oi", "bom dia", "boa tarde"]) {
      const r = responder(s);
      expect(r.encontrou, `falhou em "${s}"`).toBe(true);
      expect(r.topicoId).toBe("saudacao");
    }
  });

  it("saudação seguida de pergunta real responde a pergunta", () => {
    expect(responder("ola, como funciona o financiamento?").topicoId).toBe(
      "financiamento"
    );
  });
});
