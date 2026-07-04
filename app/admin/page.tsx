import { prisma } from "@/lib/prisma";
import type { AdminProperty } from "@/lib/admin-types";
import DashboardTable from "@/components/admin/DashboardTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard · Painel Buganza",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const properties = await prisma.property.findMany({
    orderBy: { atualizadoEm: "desc" },
    include: { fotos: { orderBy: { ordem: "asc" } } },
  });

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
    precoInterno: p.precoInterno?.toString() ?? null,
    atualizadoEm: p.atualizadoEm.toISOString(),
    fotos: p.fotos.map((f) => ({
      id: f.id,
      url: f.url,
      storageKey: f.storageKey,
      ordem: f.ordem,
      capa: f.capa,
    })),
  }));

  return <DashboardTable propertiesIniciais={serializadas} />;
}
