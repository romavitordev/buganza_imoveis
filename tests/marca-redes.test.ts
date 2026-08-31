import { describe, expect, it } from "vitest";
import {
  facebookSemLink,
  handleRede,
  urlFacebook,
  urlInstagram,
} from "@/lib/marca";

/**
 * Os campos de rede social são preenchidos por quem não edita código.
 * Estes testes fixam as três formas que de fato chegam: o handle
 * digitado, o handle com @, e a URL colada do celular — que vem com
 * rastreador na query.
 */
describe("Instagram", () => {
  it("aceita o handle puro", () => {
    expect(urlInstagram("nina_buganza")).toBe("https://instagram.com/nina_buganza");
  });

  it("aceita o handle com @", () => {
    expect(urlInstagram("@nina_buganza")).toBe("https://instagram.com/nina_buganza");
  });

  it("aceita a URL colada do celular, com rastreador", () => {
    expect(urlInstagram("https://www.instagram.com/nina_buganza?igsh=MXY123")).toBe(
      "https://www.instagram.com/nina_buganza?igsh=MXY123"
    );
  });

  it("aceita endereço sem protocolo", () => {
    expect(urlInstagram("instagram.com/nina_buganza")).toBe(
      "https://instagram.com/nina_buganza"
    );
  });

  it("não deixa espaço em branco virar link quebrado", () => {
    expect(urlInstagram("  nina_buganza  ")).toBe("https://instagram.com/nina_buganza");
  });
});

describe("rótulo exibido", () => {
  it("mostra só o usuário, venha como vier", () => {
    for (const entrada of [
      "nina_buganza",
      "@nina_buganza",
      "instagram.com/nina_buganza",
      "https://www.instagram.com/nina_buganza?igsh=MXY123",
      "https://www.instagram.com/nina_buganza/",
    ]) {
      expect(handleRede(entrada)).toBe("nina_buganza");
    }
  });
});

describe("Facebook", () => {
  it("usa o handle como página", () => {
    expect(urlFacebook("marceloimoveis")).toBe("https://www.facebook.com/marceloimoveis");
  });

  it("respeita a URL colada", () => {
    expect(urlFacebook("https://www.facebook.com/p/Imovel-Vago-100063/")).toBe(
      "https://www.facebook.com/p/Imovel-Vago-100063/"
    );
  });

  it("cai na busca quando só há o NOME da página", () => {
    // Nome com espaço não vira endereço: inventar um daria 404.
    const url = urlFacebook("Imóvel Vago Sorocaba");
    expect(url).toContain("/search/top?q=");
    expect(url).toContain(encodeURIComponent("Imóvel Vago Sorocaba"));
    expect(facebookSemLink("Imóvel Vago Sorocaba")).toBe(true);
  });

  it("não marca handle nem URL como 'sem link'", () => {
    expect(facebookSemLink("marceloimoveis")).toBe(false);
    expect(facebookSemLink("https://facebook.com/marceloimoveis")).toBe(false);
  });
});
