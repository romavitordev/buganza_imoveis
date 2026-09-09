/**
 * Importa as fotos de fotos/<CODIGO>-<slug>/ para o imóvel correspondente.
 *
 * POR QUE EXISTE: são sete imóveis com dezenas de fotos cada. Subir tudo
 * pelo painel, um arquivo por vez, é onde nasce o erro de pôr a foto da
 * casa errada no anúncio — e, principalmente, é onde a paciência acaba
 * na metade. Aqui a pasta é a fonte da verdade: o que está nela é o que
 * o anúncio tem.
 *
 * USA O MESMO CAMINHO DO PAINEL (lib/storage.ts). Sem Supabase
 * configurado, cai no fallback local em public/uploads; com Supabase,
 * sobe para lá. Nada muda neste script quando a conta existir.
 *
 *   node scripts/importar-fotos.mjs            # só mostra
 *   node scripts/importar-fotos.mjs --aplicar  # importa
 *   node scripts/importar-fotos.mjs --aplicar MIS-0001   # um só
 */
import { PrismaClient } from "@prisma/client";
import { readFile, readdir, mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const aplicar = args.includes("--aplicar");
const filtro = args.find((a) => a.startsWith("MIS-"));

const RAIZ = path.join(process.cwd(), "fotos");
const EXTENSOES = new Set([".jpg", ".jpeg", ".png", ".webp"]);

/** Espelha lib/limites-midia.ts. Duplicado porque .mjs não importa .ts. */
const MAX_FOTOS = 30;
const MAX_BYTES = 5 * 1024 * 1024;
const LADO_IDEAL = 1920;

const TIPOS = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/**
 * Lê largura e altura direto do cabeçalho do arquivo, sem dependência.
 *
 * Só para AVISAR que a foto está maior que o ideal — o script não
 * redimensiona nada. Se não conseguir ler, devolve null e segue: um
 * aviso que falha não pode travar a importação.
 */
function dimensoes(buffer, ext) {
  try {
    if (ext === ".png" && buffer.length > 24) {
      return { l: buffer.readUInt32BE(16), a: buffer.readUInt32BE(20) };
    }
    if (ext === ".jpg" || ext === ".jpeg") {
      let i = 2;
      while (i < buffer.length - 9) {
        if (buffer[i] !== 0xff) {
          i++;
          continue;
        }
        const marcador = buffer[i + 1];
        // SOF0..SOF15, menos os marcadores que não carregam dimensão
        if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
          return { a: buffer.readUInt16BE(i + 5), l: buffer.readUInt16BE(i + 7) };
        }
        i += 2 + buffer.readUInt16BE(i + 2);
      }
    }
    if (ext === ".webp" && buffer.length > 30 && buffer.toString("ascii", 12, 16) === "VP8X") {
      return {
        l: 1 + buffer.readUIntLE(24, 3),
        a: 1 + buffer.readUIntLE(27, 3),
      };
    }
  } catch {
    // formato inesperado — o aviso é opcional, a importação não é
  }
  return null;
}

/**
 * Grava o arquivo do mesmo jeito que lib/storage.ts faz no fallback
 * local: nome aleatório em public/uploads, URL pública /uploads/<nome>.
 *
 * Com Supabase configurado, este script recusa rodar e manda usar o
 * painel — subir para o bucket a partir daqui duplicaria a lógica de
 * autenticação do storage, e duplicata de código de upload é onde
 * nascem fotos órfãs pagando armazenamento para sempre.
 */
async function gravarLocal(buffer, ext) {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const nome = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, nome), buffer);
  return { url: `/uploads/${nome}`, storageKey: `local:${nome}` };
}

function formatarBytes(n) {
  return n > 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(n / 1024)} KB`;
}

async function main() {
  if (!existsSync(RAIZ)) {
    console.log("\nA pasta fotos/ não existe. Nada a fazer.\n");
    return;
  }

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(
      "\n⚠  Supabase configurado.\n" +
        "   Este script só escreve no fallback local (public/uploads).\n" +
        "   Para subir ao Supabase, use o painel em /admin — ele já comprime\n" +
        "   as fotos no navegador antes de enviar.\n"
    );
    return;
  }

  const imoveis = await prisma.property.findMany({
    orderBy: { codigo: "asc" },
    select: { id: true, codigo: true, slug: true, titulo: true, _count: { select: { fotos: true } } },
  });

  let algumParaImportar = false;

  for (const imovel of imoveis) {
    if (filtro && imovel.codigo !== filtro) continue;

    const pasta = path.join(RAIZ, `${imovel.codigo}-${imovel.slug}`);
    if (!existsSync(pasta)) {
      console.log(`\n${imovel.codigo}  — pasta não encontrada, pulando`);
      continue;
    }

    const arquivos = (await readdir(pasta))
      .filter((n) => EXTENSOES.has(path.extname(n).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));

    console.log(`\n${imovel.codigo}  ${imovel.titulo}`);

    if (arquivos.length === 0) {
      console.log(`  pasta vazia — nada a importar (tem ${imovel._count.fotos} foto(s) hoje)`);
      continue;
    }

    if (arquivos.length > MAX_FOTOS) {
      console.log(
        `  ✖ ${arquivos.length} arquivos, acima do teto de ${MAX_FOTOS}. ` +
          `Tire ${arquivos.length - MAX_FOTOS} e rode de novo.`
      );
      continue;
    }

    algumParaImportar = true;
    const paraGravar = [];

    for (const [n, nome] of arquivos.entries()) {
      const ext = path.extname(nome).toLowerCase();
      const buffer = await readFile(path.join(pasta, nome));
      const dim = dimensoes(buffer, ext);
      const avisos = [];
      if (buffer.length > MAX_BYTES) avisos.push(`${formatarBytes(buffer.length)} — acima de 5 MB`);
      else if (dim && Math.max(dim.l, dim.a) > LADO_IDEAL) {
        avisos.push(`${dim.l}×${dim.a} — maior que ${LADO_IDEAL}px`);
      }
      const marca = n === 0 ? "capa" : `  ${n + 1}`;
      console.log(`  ${marca}  ${nome}${avisos.length ? "   ⚠ " + avisos.join(", ") : ""}`);
      paraGravar.push({ buffer, ext, ordem: n, capa: n === 0 });
    }

    if (imovel._count.fotos > 0) {
      console.log(`  (as ${imovel._count.fotos} foto(s) atuais deste imóvel serão substituídas)`);
    }

    if (!aplicar) continue;

    const gravadas = [];
    for (const item of paraGravar) {
      const { url, storageKey } = await gravarLocal(item.buffer, item.ext);
      gravadas.push({ url, storageKey, ordem: item.ordem, capa: item.capa });
    }

    await prisma.$transaction(async (tx) => {
      await tx.propertyPhoto.deleteMany({ where: { propertyId: imovel.id } });
      await tx.propertyPhoto.createMany({
        data: gravadas.map((g) => ({ ...g, propertyId: imovel.id })),
      });
    });
    console.log(`  ✔ ${gravadas.length} foto(s) importada(s)`);
  }

  if (!algumParaImportar) {
    console.log("\nNenhuma foto encontrada. Coloque os arquivos nas pastas e rode de novo.");
    console.log("Instruções em fotos/LEIA-ME.md\n");
    return;
  }

  if (!aplicar) {
    console.log("\nNada foi alterado. Para importar:");
    console.log("  node scripts/importar-fotos.mjs --aplicar\n");
  } else {
    console.log("\nPronto. Recarregue o site para ver.\n");
  }
}

main()
  .catch((e) => {
    console.error("\n✖", e.message, "\n");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
