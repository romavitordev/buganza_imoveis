/** Envio de eventos de analytics do client — nunca lança, nunca bloqueia. */

export type TipoEventoTrack = "visualizacao" | "clique_whatsapp";

export function enviarEvento(slug: string, tipo: TipoEventoTrack): void {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({ slug, tipo });
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
