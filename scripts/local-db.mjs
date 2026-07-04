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
import { existsSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(".pgdata");
const PORT = 5502;

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
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
