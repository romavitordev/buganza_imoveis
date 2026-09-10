import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * O ENDEREÇO DO PAINEL NÃO ENTRA AQUI, de propósito.
 *
 * robots.txt é público — qualquer um abre /robots.txt e lê. Listar o
 * painel num "Disallow" entregaria justamente o endereço que a
 * renomeação tentou tirar de vista: bots leem esse arquivo exatamente
 * para descobrir o que não está linkado em lugar nenhum.
 *
 * Quem impede a indexação é o `noindex` do layout do painel
 * (app/painel-mis/layout.tsx), que cobre todas as páginas, inclusive a
 * de login. E quem impede o ACESSO é o middleware, não isto aqui —
 * robots.txt é pedido, não tranca.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
