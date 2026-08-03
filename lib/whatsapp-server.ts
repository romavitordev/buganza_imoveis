import "server-only";
import { MARCA } from "@/lib/marca";

/**
 * Contato via WhatsApp — lado SERVIDOR.
 *
 * O número e as mensagens ficam APENAS aqui, no backend. O navegador nunca
 * recebe o número: os botões do site apontam para /api/contato, que monta a
 * URL do WhatsApp no servidor e redireciona. Assim o número não aparece no
 * "inspecionar" e não é colhido por bots.
 *
 * Usa SOMENTE `WHATSAPP_NUMBER`. Existia um fallback para
 * `NEXT_PUBLIC_WHATSAPP_NUMBER`, removido de propósito: o prefixo
 * NEXT_PUBLIC_ marca uma variável como "pode ir para o navegador", e
 * bastava alguém referenciá-la em qualquer componente de cliente para o
 * número voltar ao "inspecionar" — anulando justamente o motivo de
 * existir o /api/contato. Sem fallback, o erro aparece no deploy (link
 * quebrado) em vez de virar um vazamento silencioso.
 */

export function whatsappNumber(): string {
  return process.env.WHATSAPP_NUMBER ?? "";
}

export const MENSAGEM_GERAL =
  "Olá! Vim pelo site e gostaria de saber mais sobre os imóveis disponíveis.";

export const MENSAGEM_ANUNCIAR =
  `Olá! Tenho um imóvel e gostaria de anunciá-lo com a ${MARCA.nome}. Podemos conversar?`;

export function mensagemImovel(titulo: string, codigo: string): string {
  return `Olá! Tenho interesse no imóvel "${titulo}" (cód. ${codigo}). Poderia me passar mais informações e valores?`;
}

export function whatsappUrl(mensagem: string): string {
  return `https://wa.me/${whatsappNumber()}?text=${encodeURIComponent(mensagem)}`;
}
