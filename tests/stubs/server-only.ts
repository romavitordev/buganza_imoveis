/**
 * Substituto de `server-only` nos testes (ver vitest.config.ts).
 *
 * O pacote real lança quando importado fora de um Server Component, o
 * que é justamente a proteção que queremos em produção — mas impediria
 * testar qualquer lib de servidor. Aqui ele é um módulo vazio; a trava
 * segue ativa no build do Next.
 */
export {};
