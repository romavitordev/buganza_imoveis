import { existsSync, readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { ROTA_LOGIN, ROTA_PAINEL, caminhoPainel } from "@/lib/rotas";

/**
 * O endereço do painel vive em três lugares que o compilador NÃO liga
 * entre si:
 *
 *   1. a constante ROTA_PAINEL, usada nos links e redirects;
 *   2. o nome da PASTA em app/, que é o que define a rota de verdade;
 *   3. o `matcher` do middleware, que não aceita variável porque o Next
 *      lê essa configuração em tempo de build.
 *
 * Se os três saírem de sincronia, nada quebra no build: os links levam a
 * um 404, ou — bem pior — o middleware deixa de cobrir o painel e ele
 * fica acessível sem sessão. Os dois casos passam despercebidos até
 * alguém tropeçar. Daí estes testes.
 */
describe("endereço do painel", () => {
  it("tem uma pasta correspondente em app/", () => {
    const pasta = path.join(process.cwd(), "app", ROTA_PAINEL.replace(/^\//, ""));
    expect(
      existsSync(pasta),
      `ROTA_PAINEL é "${ROTA_PAINEL}" mas não existe ${pasta}. ` +
        "Renomeie a pasta em app/ junto com a constante."
    ).toBe(true);
  });

  it("a página de login existe dentro dessa pasta", () => {
    const login = path.join(
      process.cwd(),
      "app",
      ROTA_LOGIN.replace(/^\//, ""),
      "page.tsx"
    );
    expect(existsSync(login), `esperava encontrar ${login}`).toBe(true);
  });

  it("está coberto pelo matcher do middleware", () => {
    const middleware = readFileSync(
      path.join(process.cwd(), "middleware.ts"),
      "utf-8"
    );
    const matcher = middleware.match(/matcher:[\s\S]*?\[([^\]]+)\]/)?.[1] ?? "";
    expect(
      matcher.includes(`"${ROTA_PAINEL}/:path*"`),
      `O matcher do middleware não cobre ${ROTA_PAINEL}. ` +
        `Sem isso o painel fica acessível SEM SESSÃO. Matcher atual: ${matcher.trim()}`
    ).toBe(true);
  });

  it("não sobrou nenhum link para o endereço antigo", () => {
    // Varre o código à procura de "/admin" usado como caminho de página.
    // "/api/admin" continua válido e é ignorado.
    const alvos: string[] = [];
    const varrer = (dir: string) => {
      for (const entrada of require("fs").readdirSync(dir, { withFileTypes: true })) {
        const completo = path.join(dir, entrada.name);
        if (entrada.isDirectory()) {
          if (entrada.name === "node_modules" || entrada.name.startsWith(".")) continue;
          varrer(completo);
        } else if (/\.(ts|tsx)$/.test(entrada.name)) {
          alvos.push(completo);
        }
      }
    };
    for (const raiz of ["app", "components", "lib"]) {
      varrer(path.join(process.cwd(), raiz));
    }

    const antigos = /(?<!\/api)["'`]\/admin(?=[/"'`])/;
    const culpados = alvos.filter((f) => {
      if (f.endsWith(path.join("lib", "rotas.ts"))) return false; // só comentário
      return antigos.test(readFileSync(f, "utf-8"));
    });

    expect(
      culpados,
      `Estes arquivos ainda apontam para o endereço antigo do painel:\n${culpados.join("\n")}`
    ).toEqual([]);
  });

  it("caminhoPainel monta subcaminhos a partir da constante", () => {
    expect(caminhoPainel()).toBe(ROTA_PAINEL);
    expect(caminhoPainel("leads")).toBe(`${ROTA_PAINEL}/leads`);
    expect(caminhoPainel("imoveis", "novo")).toBe(`${ROTA_PAINEL}/imoveis/novo`);
  });
});
