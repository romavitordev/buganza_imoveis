import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("remove acentos e vira kebab-case", () => {
    expect(slugify("Apartamento de 2 quartos no Campolim")).toBe(
      "apartamento-de-2-quartos-no-campolim"
    );
    expect(slugify("Sala comercial — Centro, Sorocaba/SP")).toBe(
      "sala-comercial-centro-sorocaba-sp"
    );
    expect(slugify("Coração médio çãõ")).toBe("coracao-medio-cao");
  });

  it("não deixa hífens nas pontas nem passa de 80 chars", () => {
    expect(slugify("  --Casa térrea--  ")).toBe("casa-terrea");
    expect(slugify("a".repeat(200)).length).toBeLessThanOrEqual(80);
  });

  it("texto vazio ou só símbolos cai no fallback 'imovel'", () => {
    expect(slugify("")).toBe("imovel");
    expect(slugify("!!!")).toBe("imovel");
  });
});