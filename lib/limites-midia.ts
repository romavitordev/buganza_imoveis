/**
 * Tetos de mídia por imóvel — um só lugar, porque existem DOIS caminhos
 * de upload (via servidor em dev, direto para o Supabase em produção) e
 * um limite que vale só em um deles não é limite.
 */

/** 5 MB por foto, já depois da compressão do navegador. */
export const MAX_FOTO_BYTES = 5 * 1024 * 1024;

/** 50 MB por vídeo. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

/**
 * Quantas fotos um imóvel pode ter.
 *
 * POR QUE EXISTE: não havia teto nenhum. Um anúncio podia acumular
 * centenas de fotos, e cada uma custa em três lugares — espaço no
 * Supabase, transformação de imagem na Vercel (cobrada por foto e
 * largura) e peso da galeria para quem abre a página no celular.
 *
 * 30 é folgado de propósito: uma casa grande bem fotografada não passa
 * de 25. O número existe para impedir o acidente — a pasta inteira do
 * celular arrastada de uma vez —, não para atrapalhar quem anuncia
 * direito.
 */
export const MAX_FOTOS_POR_IMOVEL = 30;

/** Mensagem única, para os dois caminhos falarem igual. */
export function erroLimiteFotos(existentes: number): string {
  const restam = Math.max(0, MAX_FOTOS_POR_IMOVEL - existentes);
  return restam === 0
    ? `Este imóvel já tem ${MAX_FOTOS_POR_IMOVEL} fotos, que é o máximo. Remova alguma antes de adicionar outra.`
    : `Cabem no máximo ${MAX_FOTOS_POR_IMOVEL} fotos por imóvel — ainda dá para enviar ${restam}.`;
}
