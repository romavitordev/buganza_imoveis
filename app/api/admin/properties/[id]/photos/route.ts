import { NextResponse } from "next/server";
import type { PropertyPhoto } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { uploadPropertyPhoto } from "@/lib/storage";
import { revalidarPaginasPublicas } from "@/lib/revalidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TAMANHO_BYTES = 5 * 1024 * 1024; // 5 MB

interface Params {
  params: { id: string };
}

/**
 * PATCH — reordena TODAS as fotos de uma vez (drag-and-drop no admin).
 * Body: { ordem: [photoId, photoId, ...] } — precisa conter exatamente
 * os ids das fotos do imóvel, na nova ordem.
 */
export async function PATCH(request: Request, { params }: Params) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { id: true, slug: true },
  });
  if (!property) {
    return NextResponse.json(
      { erro: "Imóvel não encontrado." },
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

  const ordem =
    typeof body === "object" && body !== null && "ordem" in body
      ? (body as { ordem: unknown }).ordem
      : null;

  if (
    !Array.isArray(ordem) ||
    !ordem.every((id): id is string => typeof id === "string")
  ) {
    return NextResponse.json(
      { erro: "Informe { ordem: [ids das fotos] }." },
      { status: 400 }
    );
  }

  const existentes = await prisma.propertyPhoto.findMany({
    where: { propertyId: property.id },
    select: { id: true },
  });
  const idsExistentes = new Set(existentes.map((f) => f.id));
  const idsRecebidos = new Set(ordem);
  if (
    idsExistentes.size !== idsRecebidos.size ||
    ordem.some((id) => !idsExistentes.has(id))
  ) {
    return NextResponse.json(
      { erro: "A lista precisa conter exatamente as fotos deste imóvel." },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(
      ordem.map((id, indice) =>
        prisma.propertyPhoto.update({
          where: { id },
          data: { ordem: indice },
        })
      )
    );

    const fotos = await prisma.propertyPhoto.findMany({
      where: { propertyId: property.id },
      orderBy: { ordem: "asc" },
    });
    revalidarPaginasPublicas(property.slug);
    return NextResponse.json({ fotos });
  } catch (e) {
    console.error("[admin/photos PATCH ordem]", e);
    return NextResponse.json(
      { erro: "Erro ao salvar a nova ordem. Tente novamente." },
      { status: 500 }
    );
  }
}

/** POST — upload de uma ou mais fotos (multipart/form-data, campo "fotos"). */
export async function POST(request: Request, { params }: Params) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: { fotos: { orderBy: { ordem: "desc" }, take: 1 } },
  });

  if (!property) {
    return NextResponse.json(
      { erro: "Imóvel não encontrado." },
      { status: 404 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { erro: "Envie as fotos como multipart/form-data." },
      { status: 400 }
    );
  }

  const arquivos = formData
    .getAll("fotos")
    .filter((item): item is File => item instanceof File);

  if (arquivos.length === 0) {
    return NextResponse.json(
      { erro: "Nenhuma foto enviada." },
      { status: 400 }
    );
  }

  // Validação de todos os arquivos antes de subir qualquer um
  for (const arquivo of arquivos) {
    if (!arquivo.type.startsWith("image/")) {
      return NextResponse.json(
        { erro: `"${arquivo.name}" não é uma imagem válida.` },
        { status: 400 }
      );
    }
    if (arquivo.size > MAX_TAMANHO_BYTES) {
      return NextResponse.json(
        { erro: `"${arquivo.name}" excede o limite de 5 MB.` },
        { status: 400 }
      );
    }
  }

  try {
    const totalExistente = await prisma.propertyPhoto.count({
      where: { propertyId: property.id },
    });
    let proximaOrdem =
      property.fotos.length > 0 ? property.fotos[0].ordem + 1 : 0;

    const criadas: PropertyPhoto[] = [];
    for (const arquivo of arquivos) {
      const { url, storageKey } = await uploadPropertyPhoto(
        property.id,
        arquivo
      );
      const foto = await prisma.propertyPhoto.create({
        data: {
          propertyId: property.id,
          url,
          storageKey,
          ordem: proximaOrdem++,
          // Primeira foto do imóvel vira capa automaticamente
          capa: totalExistente === 0 && criadas.length === 0,
        },
      });
      criadas.push(foto);
    }

    revalidarPaginasPublicas(property.slug);
    return NextResponse.json({ fotos: criadas }, { status: 201 });
  } catch (e) {
    console.error("[admin/photos POST]", e);
    return NextResponse.json(
      { erro: "Erro ao enviar as fotos. Tente novamente." },
      { status: 500 }
    );
  }
}
