import { describe, expect, it } from "vitest";
import { limitar, liberar } from "@/lib/ratelimit";

/**
 * Testa o backend de memória (sem UPSTASH_* no ambiente de teste).
 * O backend Upstash compartilha a mesma API e é exercitado em produção.
 */
describe("limitar (memória)", () => {
  it("permite até o máximo e bloqueia a partir dele", async () => {
    const chave = `teste:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      const r = await limitar(chave, 3, 60_000);
      expect(r.permitido).toBe(true);
    }
    const bloqueado = await limitar(chave, 3, 60_000);
    expect(bloqueado.permitido).toBe(false);
    expect(bloqueado.liberaEmSegundos).toBeGreaterThan(0);
  });

  it("liberar zera o contador", async () => {
    const chave = `teste:${Math.random()}`;
    for (let i = 0; i < 4; i++) await limitar(chave, 3, 60_000);
    await liberar(chave);
    const denovo = await limitar(chave, 3, 60_000);
    expect(denovo.permitido).toBe(true);
    expect(denovo.restantes).toBe(2);
  });

  it("chaves diferentes não se misturam", async () => {
    const a = `teste:${Math.random()}`;
    const b = `teste:${Math.random()}`;
    for (let i = 0; i < 4; i++) await limitar(a, 3, 60_000);
    const rb = await limitar(b, 3, 60_000);
    expect(rb.permitido).toBe(true);
  });
});
