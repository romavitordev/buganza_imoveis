import "server-only";

/**
 * Contato via WhatsApp — lado SERVIDOR.
 *
 * O número e as mensagens ficam APENAS aqui, no backend. O navegador nunca
 * recebe o número: os botões do site apontam para /api/contato, que monta a
 * URL do WhatsApp no servidor e redireciona. Assim o número não aparece no
 * "inspecionar" e não é colhido por bots.
 *
 * Usa WHATSAPP_NUMBER (server-only). Cai para NEXT_PUBLIC_WHATSAPP_NUMBER
 * apenas como conveniência em ambientes que ainda não migraram.
 */

export function whatsappNumber(): string {
  return (
    process.env.WHATSAPP_NUMBER ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    ""
  );
}

export const MENSAGEM_GERAL =
  "Olá! Vim pelo site e gostaria de saber mais sobre os imóveis disponíveis.";

export const MENSAGEM_ANUNCIAR =
  "Olá! Tenho um imóvel e gostaria de anunciá-lo com a Imóveis Buganza. Podemos conversar?";

export function mensagemImovel(titulo: string, codigo: string): string {
  return `Olá! Tenho interesse no imóvel "${titulo}" (cód. ${codigo}). Poderia me passar mais informações e valores?`;
}

export function whatsappUrl(mensagem: string): string {
  return `https://wa.me/${whatsappNumber()}?text=${encodeURIComponent(mensagem)}`;
}
