/**
 * RETENÇÃO DE DADOS — apaga o que passou do prazo prometido.
 *
 * POR QUE ISTO EXISTE: a política de privacidade declara um prazo para
 * cada dado pessoal, e prazo declarado sem nada que o cumpra é promessa
 * falsa — o oposto do que a LGPD pede (art. 15, I e art. 16: o
 * tratamento termina quando a finalidade se esgota, e o dado deve ser
 * eliminado). Um banco que só cresce descumpre a política do próprio
 * site.
 *
 * Os prazos aqui e os da página /privacidade têm que andar JUNTOS. Ao
 * mudar um, mude o outro.
 *
 *   node scripts/retencao.mjs            → só mostra o que apagaria
 *   node scripts/retencao.mjs --aplicar  → apaga de verdade
 *
 * O ensaio é o padrão de propósito: isto apaga dado de gente.
 *
 * PRECISA RODAR PERIODICAMENTE. Uma vez por mês basta. Ver o
 * CHECKLIST-DEPLOY.md — na Vercel, um Cron Job resolve.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const aplicar = process.argv.includes("--aplicar");

/** Meses de guarda de cada tipo — espelham a tabela da /privacidade. */
const PRAZOS = {
  /** Medição de audiência: identificador pseudonimizado do dispositivo. */
  eventos: 12,
  /** Perguntas sem resposta feitas ao atendimento. */
  perguntas: 12,
  /**
   * Contatos deixados no atendimento. Prazo maior porque a finalidade
   * (retornar sobre um imóvel) sobrevive a uma negociação longa —
   * comprar imóvel não é decisão de semana.
   */
  leads: 24,
};

function limite(meses) {
  const d = new Date();
  d.setMonth(d.getMonth() - meses);
  return d;
}

const url = process.env.DATABASE_URL ?? "";
const local = /localhost|127\.0\.0\.1/.test(url);
console.log(`Banco: ${local ? "LOCAL" : "REMOTO"}`);
console.log(aplicar ? "Modo: APAGANDO\n" : "Modo: ensaio (nada será apagado)\n");

const alvos = [
  {
    nome: `Eventos de audiência com mais de ${PRAZOS.eventos} meses`,
    where: { criadoEm: { lt: limite(PRAZOS.eventos) } },
    contar: (w) => prisma.propertyEvent.count({ where: w }),
    apagar: (w) => prisma.propertyEvent.deleteMany({ where: w }),
  },
  {
    nome: `Perguntas do atendimento com mais de ${PRAZOS.perguntas} meses`,
    where: { criadoEm: { lt: limite(PRAZOS.perguntas) } },
    contar: (w) => prisma.chatPergunta.count({ where: w }),
    apagar: (w) => prisma.chatPergunta.deleteMany({ where: w }),
  },
  {
    nome: `Contatos sem interação há mais de ${PRAZOS.leads} meses`,
    where: { criadoEm: { lt: limite(PRAZOS.leads) } },
    contar: (w) => prisma.lead.count({ where: w }),
    apagar: (w) => prisma.lead.deleteMany({ where: w }),
  },
];

let total = 0;
for (const alvo of alvos) {
  const quantos = await alvo.contar(alvo.where);
  total += quantos;
  if (aplicar && quantos > 0) {
    const r = await alvo.apagar(alvo.where);
    console.log(`  apagados ${r.count} — ${alvo.nome}`);
  } else {
    console.log(`  ${quantos} — ${alvo.nome}`);
  }
}

console.log(
  total === 0
    ? "\nNada fora do prazo. Banco em dia com a política."
    : aplicar
      ? `\nPronto: ${total} registros eliminados.`
      : `\n${total} registros estão fora do prazo. Rode com --aplicar para eliminar.`
);

await prisma.$disconnect();
