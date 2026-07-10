import { revalidatePath } from "next/cache";

/**
 * Invalida o cache ISR das páginas públicas que exibem imóveis.
 * Chamar em TODA mutação do admin (criar/editar/excluir imóvel,
 * fotos e vídeo) — o visitante vê a mudança na hora, sem esperar
 * o próximo ciclo de revalidate.
 */
export function revalidarPaginasPublicas(...slugs: (string | null | undefined)[]) {
  revalidatePath("/");
  revalidatePath("/imoveis");
  revalidatePath("/sitemap.xml");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/imoveis/${slug}`);
  }
}
