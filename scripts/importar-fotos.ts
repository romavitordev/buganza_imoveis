/**
 * Sobe as fotos de fotos/<CODIGO>-<slug>/ para o imóvel correspondente.
 *
 * A pasta é a fonte da verdade: o que está nela é o que o anúncio tem.
 * A ordem dos arquivos vira a ordem da galeria, e o primeiro vira a
 * CAPA — o que aparece no card do catálogo e na prévia do link no
 * WhatsApp.
 *
 * USA O MESMO lib/storage.ts DO PAINEL. Não há uma segunda
 * implementação de upload aqui: com o Supabase configurado, as fotos vão
 * para o bucket; sem ele, caem no fallback local, exatamente como
 * acontece quando alguém envia pelo painel.
 *
 *   npx tsx scripts/importar-fotos.ts             # só mostra
 *   npx tsx scripts/importar-fotos.ts --aplicar   # envia
 *   npx tsx scripts/importar-fotos.ts --aplicar MIS-0001   # um imóvel
 */
import { readFileSync, existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import path from "path";

// tsx não carrega .env sozinho — o Next carrega, um script avulso não.
for (const linha of readFileSync(".env", "utf-8").split("\n")) {
  const m = linha.match(/^([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const RAIZ = path.join(process.cwd(), "fotos");
const EXTENSOES = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const TIPOS: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const args = process.argv.slice(2);
const aplicar = args.includes("--aplicar");
const filtro = args.find((a) => a.startsWith("MIS-"));

function tamanho(n: number): string {
  return n > 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(n / 1024)} KB`;
}

async function main() {
  const { prisma } = await import("@/lib/prisma");
  const { uploadPropertyPhoto, deletePropertyPhotos } = await import("@/lib/storage");
  const { MAX_FOTOS_POR_IMOVEL, MAX_FOTO_BYTES } = await import("@/lib/limites-midia");

  const usandoSupabase = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const remoto = !/localhost|127[.]0[.]0[.]1/.test(process.env.DATABASE_URL ?? "");

  console.log(`\nDestino das fotos : ${usandoSupabase ? "Supabase" : "public/uploads (local)"}`);
  console.log(`Banco             : ${remoto ? "REMOTO (produção)" : "local"}`);

  if (!existsSync(RAIZ)) {
    console.log("\nA pasta fotos/ não existe. Nada a fazer.\n");
    return;
  }

  const imoveis = await prisma.property.findMany({
    orderBy: { codigo: "asc" },
    select: { id: true, codigo: true, slug: true, titulo: true, fotos: { select: { storageKey: true } } },
  });

  let totalParaEnviar = 0;
  const planos: {
    imovel: (typeof imoveis)[number];
    arquivos: { nome: string; caminho: string; bytes: number }[];
  }[] = [];

  for (const imovel of imoveis) {
    if (filtro && imovel.codigo !== filtro) continue;

    const pasta = path.join(RAIZ, `${imovel.codigo}-${imovel.slug}`);
    if (!existsSync(pasta)) {
      console.log(`\n${imovel.codigo}  — sem pasta, pulando`);
      continue;
    }

    const nomes = (await readdir(pasta))
      .filter((n) => EXTENSOES.has(path.extname(n).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));

    if (nomes.length === 0) {
      console.log(`\n${imovel.codigo}  — pasta vazia`);
      continue;
    }
    if (nomes.length > MAX_FOTOS_POR_IMOVEL) {
      console.log(
        `\n${imovel.codigo}  ✖ ${nomes.length} fotos, acima do teto de ${MAX_FOTOS_POR_IMOVEL}`
      );
      continue;
    }

    const arquivos = [];
    for (const nome of nomes) {
      const caminho = path.join(pasta, nome);
      const bytes = (await readFile(caminho)).length;
      arquivos.push({ nome, caminho, bytes });
    }

    const pesadas = arquivos.filter((a) => a.bytes > MAX_FOTO_BYTES);
    if (pesadas.length > 0) {
      console.log(`\n${imovel.codigo}  ✖ ${pesadas.length} foto(s) acima de 5 MB:`);
      pesadas.forEach((a) => console.log(`     ${a.nome} — ${tamanho(a.bytes)}`));
      console.log("     Envie estas pelo painel, que comprime no navegador.");
      continue;
    }

    planos.push({ imovel, arquivos });
    totalParaEnviar += arquivos.length;

    const soma = arquivos.reduce((s, a) => s + a.bytes, 0);
    console.log(
      `\n${imovel.codigo}  ${imovel.titulo.slice(0, 40)}` +
        `\n  ${arquivos.length} foto(s), ${tamanho(soma)}` +
        `  ·  capa: ${arquivos[0].nome}` +
        (imovel.fotos.length > 0
          ? `\n  (as ${imovel.fotos.length} já enviadas serão substituídas)`
          : "")
    );
  }

  if (planos.length === 0) {
    console.log("\nNada a enviar.\n");
    return;
  }

  if (!aplicar) {
    console.log(`\nTotal: ${totalParaEnviar} foto(s). Nada foi enviado ainda.`);
    console.log("Para enviar:  npx tsx scripts/importar-fotos.ts --aplicar\n");
    return;
  }

  console.log(`\nEnviando ${totalParaEnviar} foto(s)…\n`);
  let enviadas = 0;

  for (const { imovel, arquivos } of planos) {
    /**
     * Sobe TODAS antes de tocar no banco.
     *
     * Se o envio falhar no meio, o anúncio continua com as fotos
     * antigas em vez de ficar com metade nova e metade sumida. O que
     * subiu antes da falha é apagado do bucket, para não virar arquivo
     * órfão pagando armazenamento sem aparecer em lugar nenhum.
     */
    const novas: { url: string; storageKey: string }[] = [];
    try {
      for (let i = 0; i < arquivos.length; i++) {
        const a = arquivos[i];
        const buffer = await readFile(a.caminho);
        const ext = path.extname(a.nome).toLowerCase();
        const arquivo = new File([buffer], a.nome, { type: TIPOS[ext] });
        const r = await uploadPropertyPhoto(imovel.id, arquivo);
        novas.push({ url: r.url, storageKey: r.storageKey });
        enviadas++;
        process.stdout.write(
          `\r  ${imovel.codigo}  ${i + 1}/${arquivos.length}   (${enviadas}/${totalParaEnviar} no total)   `
        );
      }
    } catch (e) {
      console.log(`\n  ✖ ${imovel.codigo} falhou: ${(e as Error).message}`);
      if (novas.length > 0) {
        await deletePropertyPhotos(novas.map((n) => n.storageKey));
        console.log(`     ${novas.length} arquivo(s) já enviado(s) foram removidos do bucket.`);
      }
      console.log("     O anúncio ficou com as fotos que já tinha.\n");
      continue;
    }

    // Só agora as antigas saem: o banco e o bucket mudam juntos.
    const antigas = imovel.fotos.map((f) => f.storageKey);
    await prisma.$transaction(async (tx) => {
      await tx.propertyPhoto.deleteMany({ where: { propertyId: imovel.id } });
      await tx.propertyPhoto.createMany({
        data: novas.map((n, i) => ({
          propertyId: imovel.id,
          url: n.url,
          storageKey: n.storageKey,
          ordem: i,
          capa: i === 0,
        })),
      });
    });
    if (antigas.length > 0) await deletePropertyPhotos(antigas);

    console.log(`\r  ${imovel.codigo}  ✔ ${novas.length} foto(s)                              `);
  }

  const total = await prisma.propertyPhoto.count();
  console.log(`\nPronto. ${total} foto(s) no catálogo.\n`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("\n✖", e.message, "\n");
  process.exit(1);
});
