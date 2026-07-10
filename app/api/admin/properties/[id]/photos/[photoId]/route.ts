import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deletePropertyPhoto } from "@/lib/storage";
import { revalidarPaginasPublicas } from "@/lib/revalidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string; photoId: string };
}

/**
 * PATCH — define capa ou reordena.
 * Body: { capa: true } OU { mover: "cima" | "baixo" }
 */
export async function PATCH(request: Request, { params }: Params) {
  const foto = await prisma.propertyPhoto.findFirst({
    where: { id: params.photoId, propertyId: params.id },
    include: { property: { select: { slug: true } } },
  });

  if (!foto) {
    return NextResponse.json(
      { erro: "Foto não encontrada." },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { erro: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const acao =
    typeof body === "object" && body !== null
      ? (body as { capa?: unknown; mover?: unknown })
      : {};

  try {
    if (acao.capa === true) {
      await prisma.$transaction([
        prisma.propertyPhoto.updateMany({
          where: { propertyId: params.id },
          data: { capa: false },
        }),
        prisma.propertyPhoto.update({
          where: { id: foto.id },
          data: { capa: true },
        }),
      ]);
    } else if (acao.mover === "cima" || acao.mover === "baixo") {
      const vizinha = await prisma.propertyPhoto.findFirst({
        where: {
          propertyId: params.id,
          ordem:
            acao.mover === "cima"
              ? { lt: foto.ordem }
              : { gt: foto.ordem },
        },
        orderBy: { ordem: acao.mover === "cima" ? "desc" : "asc" },
      });

      if (vizinha) {
        // Troca as posições das duas fotos
        await prisma.$transaction([
          prisma.propertyPhoto.update({
            where: { id: foto.id },
            data: { ordem: vizinha.ordem },
          }),
          prisma.propertyPhoto.update({
            where: { id: vizinha.id },
            data: { ordem: foto.ordem },
          }),
        ]);
      }
    } else {
      return NextResponse.json(
        { erro: "Ação inválida. Use { capa: true } ou { mover: 'cima' | 'baixo' }." },
        { status: 400 }
      );
    }

    const fotos = await prisma.propertyPhoto.findMany({
      where: { propertyId: params.id },
      orderBy: { ordem: "asc" },
    });
    revalidarPaginasPublicas(foto.property.slug);
    return NextResponse.json({ fotos });
  } catch (e) {
    console.error("[admin/photos PATCH]", e);
    return NextResponse.json(
      { erro: "Erro ao atualizar a foto. Tente novamente." },
      { status: 500 }
    );
  }
}

/** DELETE — remove a foto do banco e do storage (via storageKey). */
export async function DELETE(_request: Request, { params }: Params) {
  const foto = await prisma.propertyPhoto.findFirst({
    where: { id: params.photoId, propertyId: params.id },
    include: { property: { select: { slug: true } } },
  });

  if (!foto) {
    return NextResponse.json(
      { erro: "Foto não encontrada." },
      { status: 404 }
    );
  }

  try {
    await prisma.propertyPhoto.delete({ where: { id: foto.id } });
    await deletePropertyPhoto(foto.storageKey);

    // Se a capa foi excluída, promove a primeira foto restante
    if (foto.capa) {
      const primeira = await prisma.propertyPhoto.findFirst({
        where: { propertyId: params.id },
        orderBy: { ordem: "asc" },
      });
      if (primeira) {
        await prisma.propertyPhoto.update({
          where: { id: primeira.id },
          data: { capa: true },
        });
      }
    }

    const fotos = await prisma.propertyPhoto.findMany({
      where: { propertyId: params.id },
      orderBy: { ordem: "asc" },
    });
    revalidarPaginasPublicas(foto.property.slug);
    return NextResponse.json({ ok: true, fotos });
  } catch (e) {
    console.error("[admin/photos DELETE]", e);
    return NextResponse.json(
      { erro: "Erro ao excluir a foto. Tente novamente." },
      { status: 500 }
    );
  }
}
