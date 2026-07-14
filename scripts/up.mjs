/**
 * `npm run up` — sobe o site local inteiro na ordem certa, num comando só:
 *
 *   1. Inicia o Postgres portátil (mesmo do db:local) e ESPERA a porta
 *      5502 aceitar conexão — passo que, feito à mão, costuma ser pulado
 *      e gera "Can't reach database server".
 *   2. Na primeira vez (banco ainda sem tabelas), roda db:push + db:seed.
 *   3. Sobe o Next em modo desenvolvimento (next dev).
 *
 * Ctrl+C encerra tudo (banco e site) de uma vez.
 *
 * Só para desenvolvimento local. Em produção (Vercel) este script não é
 * usado — lá o fluxo é build/start com o banco gerenciado (Neon).
 */

import { spawn } from "node:child_process";
import net from "node:net";
import { existsSync } from "node:fs";
import path from "node:path";

const PORT_DB = 5502;
const DATA_DIR = path.resolve(".pgdata");

/** Sobe um script npm herdando o terminal (logs aparecem ao vivo). */
function rodarNpm(script, { background = false } = {}) {
  // shell:true é obrigatório no Windows: o Node novo recusa spawnar
  // npm.cmd diretamente (spawn EINVAL). Com shell, o npm é resolvido
  // pelo próprio shell em qualquer plataforma.
  const filho = spawn("npm", ["run", script], {
    stdio: "inherit",
    shell: true,
  });
  if (!background) {
    return new Promise((resolve, reject) => {
      filho.on("exit", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`"npm run ${script}" saiu com código ${code}`))
      );
    });
  }
  return filho;
}

/** true assim que algo aceitar conexão na porta do Postgres. */
function portaAtiva(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function esperarBanco(tentativas = 40) {
  for (let i = 0; i < tentativas; i++) {
    if (await portaAtiva(PORT_DB)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  console.log("\n▶ 1/3 — subindo o banco local (Postgres :5502)…\n");
  const banco = rodarNpm("db:local", { background: true });

  // Encerra o banco junto com este processo (Ctrl+C ou fim do dev)
  const encerrar = () => {
    if (!banco.killed) banco.kill();
    process.exit(0);
  };
  process.on("SIGINT", encerrar);
  process.on("SIGTERM", encerrar);
  process.on("exit", () => {
    if (!banco.killed) banco.kill();
  });

  const pronto = await esperarBanco();
  if (!pronto) {
    console.error(
      "\n✗ O banco não respondeu na porta 5502 a tempo. Verifique o log acima."
    );
    encerrar();
    return;
  }
  console.log("\n✔ Banco no ar.\n");

  // Primeira vez: sem cluster inicializado → cria tabelas e semeia
  const bancoNovo = !existsSync(path.join(DATA_DIR, "PG_VERSION"));
  if (bancoNovo) {
    console.log("▶ 2/3 — primeira execução: criando tabelas e dados…\n");
    await rodarNpm("db:push");
    await rodarNpm("db:seed");
    console.log("\n✔ Banco preparado.\n");
  } else {
    console.log("▶ 2/3 — banco já preparado, pulando push/seed.\n");
  }

  console.log("▶ 3/3 — subindo o site (http://localhost:3000)…\n");
  const site = rodarNpm("dev", { background: true });
  site.on("exit", encerrar); // se o dev cair, derruba o banco também
}

main().catch((erro) => {
  console.error("\n✗ Falha ao subir o ambiente:", erro.message);
  process.exit(1);
});
