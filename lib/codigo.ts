import type { Prisma } from "@prisma/client";

/**
 * Gera o próximo código sequencial no formato "BZ-0001".
 * Deve ser chamado dentro de uma transação para evitar duplicidade
 * em criações simultâneas.
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

  return `BZ-${String(ultimoNumero + 1).padStart(4, "0")}`;
}
