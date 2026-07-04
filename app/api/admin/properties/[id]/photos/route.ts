import { NextResponse } from "next/server";
import type { PropertyPhoto } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { uploadPropertyPhoto } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TAMANHO_BYTES = 5 * 1024 * 1024; // 5 MB

interface Params {
  params: { id: string };
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

    return NextResponse.json({ fotos: criadas }, { status: 201 });
  } catch (e) {
    console.error("[admin/photos POST]", e);
    return NextResponse.json(
      { erro: "Erro ao enviar as fotos. Tente novamente." },
      { status: 500 }
    );
  }
}
