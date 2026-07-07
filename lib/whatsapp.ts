/**
 * Contato via WhatsApp — lado CLIENTE (seguro para o navegador).
 *
 * Aqui NÃO existe o número nem as mensagens: tudo isso fica no servidor
 * (lib/whatsapp-server.ts). Estas funções só montam o caminho interno
 * /api/contato, que o backend usa para redirecionar ao WhatsApp. Assim o
 * número não aparece no "inspecionar" e não é colhido por bots.
 */

export type ContatoCtx = "geral" | "anunciar" | "imovel";

export function linkContato(ctx: ContatoCtx, slug?: string): string {
  const params = new URLSearchParams({ ctx });
  if (slug) params.set("slug", slug);
  return `/api/contato?${params.toString()}`;
}

export function linkWhatsAppGeral(): string {
  return linkContato("geral");
}

export function linkWhatsAppAnunciar(): string {
  return linkContato("anunciar");
}

/** Link de contato de um imóvel específico (a mensagem é montada no servidor). */
export function linkWhatsAppImovel(slug: string): string {
  return linkContato("imovel", slug);
}
