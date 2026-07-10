import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadPropertyVideo, deletePropertyVideo } from "@/lib/storage";
import { revalidarPaginasPublicas } from "@/lib/revalidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TAMANHO_BYTES = 50 * 1024 * 1024; // 50 MB

interface Params {
  params: { id: string };
}

/**
 * POST — upload do vídeo do imóvel (multipart/form-data, campo "video").
 * Substitui o vídeo anterior, se houver. O vídeo aparece SÓ na página
 * de detalhe — nunca como capa do card ou nos destaques.
 */
export async function POST(request: Request, { params }: Params) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { id: true, videoStorageKey: true, slug: true },
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
      { erro: "Envie o vídeo como multipart/form-data." },
      { status: 400 }
    );
  }

  const arquivo = formData.get("video");
  if (!(arquivo instanceof File)) {
    return NextResponse.json(
      { erro: "Nenhum vídeo enviado." },
      { status: 400 }
    );
  }
  if (!arquivo.type.startsWith("video/")) {
    return NextResponse.json(
      { erro: `"${arquivo.name}" não é um vídeo válido (use MP4, WebM ou MOV).` },
      { status: 400 }
    );
  }
  if (arquivo.size > MAX_TAMANHO_BYTES) {
    return NextResponse.json(
      { erro: `"${arquivo.name}" excede o limite de 50 MB.` },
      { status: 400 }
    );
  }

  try {
    const { url, storageKey } = await uploadPropertyVideo(
      property.id,
      arquivo
    );

    // Substitui o vídeo anterior (remove o arquivo antigo do storage)
    if (property.videoStorageKey) {
      await deletePropertyVideo(property.videoStorageKey);
    }

    const atualizado = await prisma.property.update({
      where: { id: property.id },
      data: { videoUrl: url, videoStorageKey: storageKey },
      select: { videoUrl: true },
    });

    revalidarPaginasPublicas(property.slug);
    return NextResponse.json({ videoUrl: atualizado.videoUrl }, { status: 201 });
  } catch (e) {
    console.error("[admin/video POST]", e);
    return NextResponse.json(
      { erro: "Erro ao enviar o vídeo. Tente novamente." },
      { status: 500 }
    );
  }
}

/** DELETE — remove o vídeo do imóvel (banco e storage). */
export async function DELETE(_request: Request, { params }: Params) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { id: true, videoStorageKey: true, slug: true },
  });

  if (!property) {
    return NextResponse.json(
      { erro: "Imóvel não encontrado." },
      { status: 404 }
    );
  }

  try {
    await prisma.property.update({
      where: { id: property.id },
      data: { videoUrl: null, videoStorageKey: null },
    });
    if (property.videoStorageKey) {
      await deletePropertyVideo(property.videoStorageKey);
    }
    revalidarPaginasPublicas(property.slug);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/video DELETE]", e);
    return NextResponse.json(
      { erro: "Erro ao remover o vídeo. Tente novamente." },
      { status: 500 }
    );
  }
}
