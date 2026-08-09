/**
 * Roda o seed COM os imóveis de demonstração.
 *
 * Existe porque a variável tem que chegar ao processo filho e a forma
 * de fazer isso muda por sistema: `SEED_DEMO=1 npm run db:seed` é sintaxe
 * de shell POSIX e não funciona no PowerShell nem no cmd. Um wrapper em
 * Node resolve igual nos três.
 *
 * O padrão (`npm run db:seed`) cria só o administrador — o catálogo de
 * produção tem que nascer vazio. Este script é para desenvolvimento.
 */
import { spawnSync } from "node:child_process";

const r = spawnSync("prisma", ["db", "seed"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, SEED_DEMO: "1" },
});

process.exit(r.status ?? 1);
