/**
 * URL pública do site (sem barra final).
 * Defina NEXT_PUBLIC_SITE_URL em produção (ex.: https://www.marceloimoveis.com.br).
 */
export function siteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}

/**
 * Só o domínio, para pré-visualizar links no painel ("site.com.br/imoveis/…").
 * Vem da mesma variável do sitemap, então trocar de domínio não deixa um
 * endereço antigo escrito na tela do cadastro.
 */
export function dominioDoSite(): string {
  return siteUrl().replace(/^https?:\/\//, "");
}
