/**
 * Renomeia as fotos de um imóvel para a ordem escolhida.
 *
 * A ordem das fotos não é detalhe: a primeira vira a CAPA — o que
 * aparece no card do catálogo e na prévia do link no WhatsApp — e o
 * resto define o passeio que o interessado faz pelo imóvel.
 *
 * POR QUE PASSA POR NOMES TEMPORÁRIOS: renomear "05 → 01" direto
 * sobrescreve a 01 que ainda não foi movida. Com duas passadas, nenhum
 * arquivo é destruído mesmo que a nova ordem seja um embaralhamento
 * completo da antiga.
 *
 *   node scripts/ordenar-fotos.mjs MIS-0002 04 08 05 07 06 03 01 09 02
 *
 * Os argumentos depois do código são os arquivos ATUAIS na ordem nova.
 * Aceita "04" como atalho para "04.jpeg"/"04.jpg" e nomes completos.
 */
import { readdir, rename } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const [codigo, ...ordem] = process.argv.slice(2);

if (!codigo || ordem.length === 0) {
  console.log("\nuso: node scripts/ordenar-fotos.mjs <CODIGO> <arquivo1> <arquivo2> …\n");
  process.exit(1);
}

const RAIZ = path.join(process.cwd(), "fotos");
const EXTENSOES = [".jpg", ".jpeg", ".png", ".webp"];

function ehFoto(nome) {
  return EXTENSOES.includes(path.extname(nome).toLowerCase());
}

async function main() {
  const pastas = await readdir(RAIZ);
  const pasta = pastas.find((p) => p.startsWith(codigo));
  if (!pasta) {
    console.error(`\n✖ Pasta de ${codigo} não encontrada em fotos/\n`);
    process.exit(1);
  }
  const dir = path.join(RAIZ, pasta);
  const existentes = (await readdir(dir)).filter(ehFoto);

  // Resolve cada item da ordem para um arquivo real
  const resolvidos = ordem.map((item) => {
    if (existentes.includes(item)) return item;
    const achado = existentes.find(
      (n) => path.basename(n, path.extname(n)) === item
    );
    if (!achado) {
      console.error(`\n✖ "${item}" não existe em ${pasta}\n`);
      process.exit(1);
    }
    return achado;
  });

  // Toda foto tem que estar na lista: uma esquecida seria renomeada para
  // um número já usado na passada seguinte, ou ficaria fora do anúncio
  // sem ninguém perceber.
  const faltando = existentes.filter((n) => !resolvidos.includes(n));
  if (faltando.length > 0) {
    console.error(`\n✖ ${faltando.length} foto(s) fora da ordem informada:`);
    faltando.forEach((n) => console.error(`   ${n}`));
    console.error("   Inclua todas ou apague as que não vão para o anúncio.\n");
    process.exit(1);
  }

  const duplicadas = resolvidos.filter((n, i) => resolvidos.indexOf(n) !== i);
  if (duplicadas.length > 0) {
    console.error(`\n✖ repetida(s) na ordem: ${[...new Set(duplicadas)].join(", ")}\n`);
    process.exit(1);
  }

  // 1ª passada: tudo para nomes temporários
  const temporarios = [];
  for (const [i, nome] of resolvidos.entries()) {
    const tmp = `__tmp_${i}${path.extname(nome)}`;
    await rename(path.join(dir, nome), path.join(dir, tmp));
    temporarios.push({ tmp, original: nome });
  }

  // 2ª passada: temporários para a numeração final
  console.log(`\n${pasta}`);
  for (const [i, { tmp, original }] of temporarios.entries()) {
    const ext = path.extname(tmp);
    const final = `${String(i + 1).padStart(2, "0")}${ext}`;
    await rename(path.join(dir, tmp), path.join(dir, final));
    const marca = i === 0 ? "CAPA" : "    ";
    console.log(`  ${marca} ${final.padEnd(9)} ←  ${original}`);
  }

  const sobra = (await readdir(dir)).filter((n) => n.startsWith("__tmp_"));
  if (sobra.length > 0) {
    console.error(`\n⚠ sobraram temporários: ${sobra.join(", ")}\n`);
    process.exit(1);
  }
  console.log(`  ${resolvidos.length} foto(s) renomeada(s).\n`);
}

main().catch((e) => {
  console.error("\n✖", e.message, "\n");
  process.exit(1);
});
