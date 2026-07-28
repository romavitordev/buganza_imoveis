/**
 * Reconhecimento de links do YouTube (roda no cliente e no servidor).
 *
 * Por que YouTube? Vídeo servido pelo Supabase consome banda a cada
 * visitante que assiste — é o que mais encarece o storage. No YouTube
 * (não listado), o streaming é otimizado e a banda custa R$ 0.
 */

/** Extrai o ID de watch/shorts/live/embed/youtu.be; null se não for YouTube. */
export function idDoYoutube(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

/** Player embutido — domínio nocookie (menos rastreamento, mesma CSP). */
export function urlEmbedYoutube(id: string, autoplay = false): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0${
    autoplay ? "&autoplay=1" : ""
  }`;
}

/** Forma canônica gravada no banco. */
export function urlAssistirYoutube(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
