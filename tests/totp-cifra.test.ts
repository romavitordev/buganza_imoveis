import { beforeAll, describe, expect, it } from "vitest";
import { cifrarSegredo, decifrarSegredo } from "@/lib/totp";

// A chave é derivada na hora da chamada (não no carregamento do módulo),
// então basta definir o AUTH_SECRET antes dos testes rodarem.
beforeAll(() => {
  process.env.AUTH_SECRET = "segredo-de-teste-bem-longo-para-a-chave";
});

describe("segredo da 2FA cifrado em repouso", () => {
  const claro = "G4LN5KE2YDTKTRMFGLVX2BQA3XI3VKKT";

  it("o valor guardado não contém o segredo em texto", () => {
    const guardado = cifrarSegredo(claro);
    expect(guardado).not.toContain(claro);
    expect(guardado.startsWith("v1:")).toBe(true);
  });

  it("decifra de volta ao original", () => {
    expect(decifrarSegredo(cifrarSegredo(claro))).toBe(claro);
  });

  it("cada cifragem é diferente (IV aleatório)", () => {
    expect(cifrarSegredo(claro)).not.toBe(cifrarSegredo(claro));
  });

  it("adulterar o dado cifrado invalida (GCM autentica)", () => {
    const guardado = cifrarSegredo(claro);
    const partes = guardado.split(":");
    partes[3] = Buffer.from("outracoisaqualquer").toString("base64");
    expect(decifrarSegredo(partes.join(":"))).toBeNull();
  });

  it("com AUTH_SECRET diferente NÃO decifra (dump do banco não basta)", () => {
    const guardado = cifrarSegredo(claro);
    process.env.AUTH_SECRET = "outro-segredo-completamente-diferente";
    expect(decifrarSegredo(guardado)).toBeNull();
    process.env.AUTH_SECRET = "segredo-de-teste-bem-longo-para-a-chave";
  });

  it("segredo antigo em texto puro continua funcionando (migração)", () => {
    expect(decifrarSegredo(claro)).toBe(claro);
  });
});
