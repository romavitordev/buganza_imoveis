import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { AdminProperty } from "@/lib/admin-types";
import PropertyForm from "@/components/admin/PropertyForm";
import PhotoManager from "@/components/admin/PhotoManager";
import VideoManager from "@/components/admin/VideoManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Editar imóvel · Painel Buganza",
  robots: { index: false, follow: false },
};

export default async function EditarImovelPage({
  params,
}: {
  params: { id: string };
}) {
  const p = await prisma.property.findUnique({
    where: { id: params.id },
    include: { fotos: { orderBy: { ordem: "asc" } } },
  });

  if (!p) notFound();

  const property: AdminProperty = {
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
    enderecoMapa: p.enderecoMapa,
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
    visualizacoes: 0,
    cliquesWhatsApp: 0,
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-10 md:px-8">
      <PropertyForm property={property} />
      <hr className="border-black/10" />
      <PhotoManager propertyId={property.id} fotosIniciais={property.fotos} />
      <hr className="border-black/10" />
      <VideoManager
        propertyId={property.id}
        videoUrlInicial={property.videoUrl}
      />
    </main>
  );
}
