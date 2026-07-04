/**
 * Links de conversão via WhatsApp — única forma de contato do site.
 * Nenhum preço é exibido publicamente; o valor é sempre "consultado".
 */

export function whatsappNumber(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
}

export function whatsappLink(mensagem: string): string {
  return `https://wa.me/${whatsappNumber()}?text=${encodeURIComponent(mensagem)}`;
}

export const MENSAGEM_GERAL =
  "Olá! Vim pelo site e gostaria de saber mais sobre os imóveis disponíveis.";

export function mensagemImovel(titulo: string, codigo: string): string {
  return `Olá! Tenho interesse no imóvel "${titulo}" (cód. ${codigo}). Poderia me passar mais informações e valores?`;
}

export function linkWhatsAppGeral(): string {
  return whatsappLink(MENSAGEM_GERAL);
}

export function linkWhatsAppImovel(titulo: string, codigo: string): string {
  return whatsappLink(mensagemImovel(titulo, codigo));
}
