import { prisma } from "@/lib/prisma";

/** Converte um título em slug kebab-case, sem acentos. */
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (marcas combinantes)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "imovel";
}

/**
 * Garante slug único: em caso de colisão adiciona sufixo numérico (-2, -3, ...).
 * `ignoreId` permite manter o próprio slug ao editar um imóvel.
 */
export async function uniqueSlug(
  base: string,
  ignoreId?: string
): Promise<string> {
  const slugBase = slugify(base);
  let candidato = slugBase;
  let sufixo = 2;

  // Loop limitado por segurança; na prática resolve em 1–2 iterações
  for (let i = 0; i < 100; i++) {
    const existente = await prisma.property.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });
    if (!existente || existente.id === ignoreId) return candidato;
    candidato = `${slugBase}-${sufixo}`;
    sufixo++;
  }
  return `${slugBase}-${Date.now()}`;
}
