/**
 * Esvazia o CATÁLOGO — imóveis, fotos, vídeos e as métricas ligadas a
 * eles. O admin, os leads e a base do chatbot ficam intactos.
 *
 * Serve para o site estrear com o catálogo em branco, sem herdar os
 * imóveis de demonstração usados no desenvolvimento.
 *
 *   node scripts/limpar-catalogo.mjs           → só mostra o que faria
 *   node scripts/limpar-catalogo.mjs --apagar  → apaga de verdade
 *
 * A confirmação é obrigatória de propósito: rodar isto sem querer no
 * banco de produção derruba o catálogo inteiro da imobiliária.
 */
import { PrismaClient } from "@prisma/client";

const apagar = process.argv.includes("--apagar");
const prisma = new PrismaClient();

const url = process.env.DATABASE_URL ?? "";
const local = /localhost|127\.0\.0\.1/.test(url);

const imoveis = await prisma.property.findMany({
  select: { codigo: true, titulo: true, status: true },
  orderBy: { codigo: "asc" },
});

console.log(`Banco: ${local ? "LOCAL" : "REMOTO (cuidado!)"}`);
console.log(`Imóveis encontrados: ${imoveis.length}\n`);
for (const i of imoveis) console.log(`  ${i.codigo} · ${i.status} · ${i.titulo}`);

if (!apagar) {
  console.log("\nNada foi apagado. Rode com --apagar para confirmar.");
  await prisma.$disconnect();
  process.exit(0);
}

// A ordem importa: filhos primeiro, senão a chave estrangeira barra.
const eventos = await prisma.propertyEvent.deleteMany({});
const fotos = await prisma.propertyPhoto.deleteMany({});
const props = await prisma.property.deleteMany({});

console.log(
  `\nApagados: ${props.count} imóveis, ${fotos.count} fotos, ${eventos.count} eventos.`
);
console.log("Admin, leads e base do chatbot: intactos.");
await prisma.$disconnect();
