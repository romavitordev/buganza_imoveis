import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Toda rota de API do painel tem que checar a sessão NO PRÓPRIO handler.
 *
 * O middleware.ts já protege /api/admin, mas ele é uma linha de defesa
 * só, e frágil: vive num `matcher` de string. Mover uma rota, editar o
 * matcher sem perceber ou o framework mudar de comportamento derruba a
 * proteção sem erro nenhum aparecer — a rota simplesmente passa a
 * responder para qualquer um.
 *
 * Este teste é o que impede a regressão silenciosa. Ele lê o código,
 * não roda a rota: quem adicionar um handler novo sem o guarda vê o
 * teste quebrar antes de subir.
 *
 * (Verificado uma vez na mão, removendo o middleware.ts e reconstruindo:
 * as 23 rotas continuaram devolvendo 401.)
 */

const RAIZ = path.join(process.cwd(), "app", "api", "admin");
const METODOS = ["GET", "POST", "PATCH", "PUT", "DELETE"] as const;

/** A rota de login é a única exceção legítima: é onde a sessão nasce. */
const ISENTAS = [path.join("auth", "login", "route.ts")];

function rotasDoAdmin(dir: string): string[] {
  const achados: string[] = [];
  for (const nome of readdirSync(dir)) {
    const completo = path.join(dir, nome);
    if (statSync(completo).isDirectory()) {
      achados.push(...rotasDoAdmin(completo));
    } else if (nome === "route.ts") {
      achados.push(completo);
    }
  }
  return achados;
}

describe("rotas do admin exigem sessão no handler", () => {
  const rotas = rotasDoAdmin(RAIZ).filter(
    (r) => !ISENTAS.some((isenta) => r.endsWith(isenta))
  );

  it("encontra as rotas do painel", () => {
    expect(rotas.length).toBeGreaterThan(10);
  });

  it.each(rotas.map((r) => [path.relative(process.cwd(), r), r]))(
    "%s",
    (_nome, arquivo) => {
      const codigo = readFileSync(arquivo, "utf-8");

      // Cada handler exportado precisa do guarda como primeira coisa.
      // Array.from e não spread: o tsconfig mira ES5 e iterar o
      // RegExpStringIterator direto pede --downlevelIteration.
      const handlers = Array.from(
        codigo.matchAll(
          /export async function (GET|POST|PATCH|PUT|DELETE)\s*\([^)]*\)[^{]*\{([\s\S]*?)(?=\nexport async function |\n?$)/g
        )
      );

      expect(handlers.length).toBeGreaterThan(0);

      for (const [, metodo, corpo] of handlers) {
        expect(
          corpo.includes("barrarSemSessao"),
          `${metodo} não chama barrarSemSessao()`
        ).toBe(true);

        // E antes de tocar no banco: um guarda depois do prisma não
        // guarda nada.
        const posGuarda = corpo.indexOf("barrarSemSessao");
        const posPrisma = corpo.indexOf("prisma.");
        if (posPrisma !== -1) {
          expect(
            posGuarda < posPrisma,
            `${metodo} consulta o banco antes de checar a sessão`
          ).toBe(true);
        }
      }
    }
  );

  it("o guarda existe e devolve 401", async () => {
    const sessao = readFileSync(
      path.join(process.cwd(), "lib", "session.ts"),
      "utf-8"
    );
    expect(sessao).toContain("export async function barrarSemSessao");
    expect(sessao).toContain("401");
  });
});
