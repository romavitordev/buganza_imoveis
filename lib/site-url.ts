/**
 * URL pública do site (sem barra final).
 * Defina NEXT_PUBLIC_SITE_URL em produção (ex.: https://www.buganzaimoveis.com.br).
 */
export function siteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}
