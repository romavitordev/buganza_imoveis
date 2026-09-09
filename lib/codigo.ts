import type { Prisma } from "@prisma/client";

/**
 * Gera o próximo código sequencial no formato "MIS-0001".
 * Deve ser chamado dentro de uma transação para evitar duplicidade
 * em criações simultâneas.
 *
 * O prefixo era "BZ", de Buganza — o nome antigo da imobiliária. Trocado
 * para MIS (Marcelo Imóveis Sorocaba) em 08/09/2026, com o catálogo
 * ainda vazio, que era a única janela barata: o código entra no endereço
 * de cada anúncio e é como os corretores se referem aos imóveis no
 * WhatsApp. Depois de publicar, mudar o prefixo renumeraria tudo e
 * quebraria os links já enviados.
 *
 * A conta ignora o prefixo (só olha os dígitos), então um catálogo com
 * códigos antigos e novos convivendo continua numerando certo.
 */
export async function proximoCodigo(
  tx: Prisma.TransactionClient
): Promise<string> {
  const ultimo = await tx.property.findFirst({
    orderBy: { codigo: "desc" },
    select: { codigo: true },
  });

  const ultimoNumero = ultimo
    ? parseInt(ultimo.codigo.replace(/\D/g, ""), 10) || 0
    : 0;

  return `MIS-${String(ultimoNumero + 1).padStart(4, "0")}`;
}
