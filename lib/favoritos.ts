/**
 * Favoritos do visitante — 100% no navegador (localStorage), sem conta
 * e sem enviar nada ao servidor. A página /favoritos busca os imóveis
 * pela API pública usando os ids salvos.
 */

const CHAVE = "bz_favoritos";
const MAXIMO = 60; // mesmo limite do parâmetro ?ids= da API pública

/** Evento disparado a cada mudança — mantém coração e página em sincronia. */
export const EVENTO_FAVORITOS = "bz:favoritos";

export function lerFavoritos(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    const lista: unknown = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista)
      ? lista.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function ehFavorito(id: string): boolean {
  return lerFavoritos().includes(id);
}

/** Alterna o favorito e retorna o novo estado (true = agora é favorito). */
export function alternarFavorito(id: string): boolean {
  const atual = lerFavoritos();
  const agoraFavorito = !atual.includes(id);
  const proxima = agoraFavorito
    ? [...atual, id].slice(-MAXIMO)
    : atual.filter((item) => item !== id);
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(proxima));
  } catch {
    // storage cheio ou bloqueado (modo privado) — o coração ainda responde
    // na sessão atual, só não persiste
  }
  window.dispatchEvent(new CustomEvent(EVENTO_FAVORITOS));
  return agoraFavorito;
}
