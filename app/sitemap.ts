import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const fixas: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/imoveis`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/privacidade`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const imoveis = await prisma.property
    .findMany({
      where: { status: "ATIVO" },
      select: { slug: true, atualizadoEm: true },
    })
    .catch(() => []);

  return [
    ...fixas,
    ...imoveis.map((imovel) => ({
      url: `${base}/imoveis/${imovel.slug}`,
      lastModified: imovel.atualizadoEm,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
