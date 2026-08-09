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

/**
 * true se um Postgres DE VERDADE atende na porta.
 *
 * Aceitar a conexão TCP não basta, e essa foi a origem de um bug chato:
 * quando o postgres morre sem shutdown limpo (o Windows matando por
 * falta de memória, por exemplo), o socket pode continuar preso à porta
 * com o dono já morto. O `connect` ia em frente, este script anunciava
 * "já está rodando, nada a fazer" e saía — e todo `db:seed` seguinte
 * respondia "Can't reach database server", sem porta livre e sem
 * servidor, para sempre.
 *
 * Então aqui se faz o aperto de mão: manda-se um SSLRequest (os 8 bytes
 * que todo cliente Postgres manda primeiro) e espera-se a resposta, que
 * é um único byte, 'S' ou 'N'. Socket zumbi não responde nada.
 */
function postgresResponde() {
  return new Promise((resolve) => {
    const socket = net.connect({ port: PORT, host: "127.0.0.1" });
    const encerrar = (valor) => {
      socket.destroy();
      resolve(valor);
    };
    socket.once("connect", () => {
      const sslRequest = Buffer.alloc(8);
      sslRequest.writeInt32BE(8, 0);
      sslRequest.writeInt32BE(80877103, 4);
      socket.write(sslRequest);
    });
    socket.once("data", (dados) => {
      const r = dados[0];
      encerrar(r === 0x53 || r === 0x4e); // 'S' ou 'N'
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(2000, () => encerrar(false));
  });
}

/** true se ALGO ocupa a porta, respondendo Postgres ou não. */
function portaOcupada() {
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

/** Porta presa por processo morto: explica o que fazer e sai. */
async function abortarSePortaPresa() {
  if (!(await portaOcupada())) return;
  console.error(
    [
      "",
      `✖ A porta ${PORT} está ocupada, mas quem responde ali não é um Postgres.`,
      "  Normalmente é um postgres que morreu sem fechar o socket.",
      "",
      "  Windows:  Get-Process postgres* | Stop-Process -Force",
      "  Depois:   npm run db:local",
      "",
    ].join("\n")
  );
  process.exit(1);
}

// Lock obsoleto: postmaster.pid existe mas nenhum servidor responde
// (acontece quando o processo é morto sem shutdown limpo).
const pidFile = path.join(DATA_DIR, "postmaster.pid");
if (existsSync(pidFile)) {
  if (await postgresResponde()) {
    console.log(
      `✔ O Postgres local já está rodando na porta ${PORT}. Nada a fazer.`
    );
    process.exit(0);
  }
  console.log("Removendo lock obsoleto (postmaster.pid sem servidor ativo)…");
  rmSync(pidFile, { force: true });
  await abortarSePortaPresa();
}

// Sem postmaster.pid, mas com a porta ocupada por um zumbi: mesma
// história, e sem esta checagem o erro que aparece é um EADDRINUSE cru.
await abortarSePortaPresa();

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
