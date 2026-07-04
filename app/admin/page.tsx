import { prisma } from "@/lib/prisma";
import type { AdminProperty } from "@/lib/admin-types";
import DashboardTable from "@/components/admin/DashboardTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard · Painel Buganza",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [properties, eventosTotais, eventos7d, dispositivos7d, origens7d] =
    await Promise.all([
      prisma.property.findMany({
        orderBy: { atualizadoEm: "desc" },
        include: { fotos: { orderBy: { ordem: "asc" } } },
      }),
      prisma.propertyEvent.groupBy({
        by: ["propertyId", "tipo"],
        _count: { _all: true },
      }),
      prisma.propertyEvent.groupBy({
        by: ["tipo"],
        where: { criadoEm: { gte: seteDiasAtras } },
        _count: { _all: true },
      }),
      prisma.propertyEvent.groupBy({
        by: ["dispositivo"],
        where: {
          criadoEm: { gte: seteDiasAtras },
          dispositivo: { not: null },
        },
        _count: { _all: true },
      }),
      prisma.propertyEvent.groupBy({
        by: ["origem"],
        where: { criadoEm: { gte: seteDiasAtras }, origem: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { origem: "desc" } },
        take: 3,
      }),
    ]);

  const contagem = new Map<string, { views: number; cliques: number }>();
  for (const evento of eventosTotais) {
    const atual = contagem.get(evento.propertyId) ?? { views: 0, cliques: 0 };
    if (evento.tipo === "VISUALIZACAO") atual.views += evento._count._all;
    else atual.cliques += evento._count._all;
    contagem.set(evento.propertyId, atual);
  }

  const serializadas: AdminProperty[] = properties.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    slug: p.slug,
    titulo: p.titulo,
    descricao: p.descricao,
    tipo: p.tipo,
    transacao: p.transacao,
    status: p.status,
    destaque: p.destaque,
    cidade: p.cidade,
    bairro: p.bairro,
    quartos: p.quartos,
    banheiros: p.banheiros,
    vagas: p.vagas,
    areaM2: p.areaM2,
    precoVenda: p.precoVenda?.toString() ?? null,
    precoLocacao: p.precoLocacao?.toString() ?? null,
    precoInterno: p.precoInterno?.toString() ?? null,
    videoUrl: p.videoUrl,
    atualizadoEm: p.atualizadoEm.toISOString(),
    fotos: p.fotos.map((f) => ({
      id: f.id,
      url: f.url,
      storageKey: f.storageKey,
      ordem: f.ordem,
      capa: f.capa,
    })),
    visualizacoes: contagem.get(p.id)?.views ?? 0,
    cliquesWhatsApp: contagem.get(p.id)?.cliques ?? 0,
  }));

  const totalDispositivos = dispositivos7d.reduce(
    (soma, d) => soma + d._count._all,
    0
  );
  const mobile7d =
    dispositivos7d.find((d) => d.dispositivo === "MOBILE")?._count._all ?? 0;

  const resumo7d = {
    visualizacoes:
      eventos7d.find((e) => e.tipo === "VISUALIZACAO")?._count._all ?? 0,
    cliquesWhatsApp:
      eventos7d.find((e) => e.tipo === "CLIQUE_WHATSAPP")?._count._all ?? 0,
    percentualMobile:
      totalDispositivos > 0
        ? Math.round((mobile7d / totalDispositivos) * 100)
        : null,
    origens: origens7d.map((o) => ({
      origem: o.origem ?? "direto",
      total: o._count._all,
    })),
  };

  return (
    <DashboardTable propertiesIniciais={serializadas} resumo7d={resumo7d} />
  );
}
