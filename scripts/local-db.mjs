/**
 * Banco Postgres local para desenvolvimento — sem instalar nada no sistema.
 * Usa o pacote `embedded-postgres` (binários portáteis em node_modules),
 * com dados persistidos em .pgdata/ (ignorado pelo git).
 *
 * Uso:  npm run db:local     (deixe rodando em um terminal)
 * Depois, em outro terminal: npm run db:push && npm run db:seed && npm run dev
 *
 * O DATABASE_URL correspondente é:
 *   postgresql://postgres:postgres@localhost:5502/buganza
 */

import EmbeddedPostgres from "embedded-postgres";
import { existsSync, rmSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const DATA_DIR = path.resolve(".pgdata");
const PORT = 5502;

/** true se algo está realmente escutando na porta do Postgres. */
function portaAtiva() {
  return new Promise((resolve) => {
    const socket = net.connect({ port: PORT, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(1500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

// Lock obsoleto: postmaster.pid existe mas nenhum servidor responde
// (acontece quando o processo é morto sem shutdown limpo).
const pidFile = path.join(DATA_DIR, "postmaster.pid");
if (existsSync(pidFile)) {
  if (await portaAtiva()) {
    console.log(
      `✔ O Postgres local já está rodando na porta ${PORT}. Nada a fazer.`
    );
    process.exit(0);
  }
  console.log("Removendo lock obsoleto (postmaster.pid sem servidor ativo)…");
  rmSync(pidFile, { force: true });
}

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
  // Sem isso o initdb no Windows cria o cluster em WIN1252 e textos com
  // emoji/caracteres especiais falham com "22P05". Só vale para cluster
  // NOVO — para aplicar num .pgdata existente, apague a pasta e rode
  // db:push + db:seed de novo.
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

const jaInicializado = existsSync(path.join(DATA_DIR, "PG_VERSION"));

if (!jaInicializado) {
  console.log("Inicializando cluster Postgres em .pgdata/ …");
  await pg.initialise();
}

try {
  await pg.start();
} catch (erro) {
  const mensagem = String(erro?.message ?? erro ?? "");
  if (mensagem.includes("postmaster.pid") || mensagem.includes("already")) {
    console.log(
      "✔ O Postgres local já está rodando (postmaster ativo em .pgdata/). Nada a fazer."
    );
    process.exit(0);
  }
  throw erro;
}

if (!jaInicializado) {
  await pg.createDatabase("buganza");
}
console.log(
  `\n✔ Postgres local no ar: postgresql://postgres:postgres@localhost:${PORT}/buganza`
);
console.log("  (Ctrl+C para parar)\n");

async function parar() {
  console.log("\nParando Postgres local…");
  try {
    await pg.stop();
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", parar);
process.on("SIGTERM", parar);
