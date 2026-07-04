/** Envio de eventos de analytics do client — nunca lança, nunca bloqueia. */

export type TipoEventoTrack = "visualizacao" | "clique_whatsapp";

/** Origem do acesso: utm_source tem prioridade; senão, domínio do referrer. */
function origemDoAcesso(): string | null {
  try {
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    if (utm) return utm.slice(0, 60);
    if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      // acesso interno (navegação dentro do próprio site) não é origem
      if (host && host !== window.location.hostname) return host;
    }
  } catch {
    // URL malformada — ignora
  }
  return null;
}

export function enviarEvento(slug: string, tipo: TipoEventoTrack): void {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({ slug, tipo, origem: origemDoAcesso() });
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/track", blob)) return;
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // analytics jamais pode quebrar a navegação
  }
}
