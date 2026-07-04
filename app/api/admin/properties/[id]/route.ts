import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uniqueSlug, slugify } from "@/lib/slug";
import { deletePropertyPhotos } from "@/lib/storage";
import {
  parsePropertyInput,
  isValidationError,
} from "@/lib/property-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/** PATCH — edita um imóvel. Aceita payload completo ou só { destaque } / { status }. */
export async function PATCH(request: Request, { params }: Params) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { erro: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const existente = await prisma.property.findUnique({
    where: { id: params.id },
    select: { id: true, titulo: true },
  });
  if (!existente) {
    return NextResponse.json(
      { erro: "Imóvel não encontrado." },
      { status: 404 }
    );
  }

  // Atualização rápida (toggle de destaque no dashboard)
  if (
    typeof payload === "object" &&
    payload !== null &&
    Object.keys(payload).length === 1 &&
    "destaque" in payload
  ) {
    const destaque = (payload as { destaque: unknown }).destaque === true;
    const property = await prisma.property.update({
      where: { id: params.id },
      data: { destaque },
      include: { fotos: { orderBy: { ordem: "asc" } } },
    });
    return NextResponse.json({ property });
  }

  const input = parsePropertyInput(payload);
  if (isValidationError(input)) {
    return NextResponse.json(input, { status: 400 });
  }

  try {
    const slug = await uniqueSlug(
      input.slug ?? slugify(input.titulo),
      params.id
    );

    const property = await prisma.property.update({
      where: { id: params.id },
      data: {
        slug,
        titulo: input.titulo,
        descricao: input.descricao,
        tipo: input.tipo,
        transacao: input.transacao,
        status: input.status,
        destaque: input.destaque,
        cidade: input.cidade,
        bairro: input.bairro,
        quartos: input.quartos,
        banheiros: input.banheiros,
        vagas: input.vagas,
        areaM2: input.areaM2,
        precoVenda: input.precoVenda,
        precoLocacao: input.precoLocacao,
        precoInterno: input.precoInterno,
      },
      include: { fotos: { orderBy: { ordem: "asc" } } },
    });

    return NextResponse.json({ property });
  } catch (e) {
    console.error("[admin/properties PATCH]", e);
    return NextResponse.json(
      { erro: "Erro ao salvar as alterações. Tente novamente." },
      { status: 500 }
    );
  }
}

/** DELETE — exclui o imóvel, as fotos do banco (cascade) e do storage. */
export async function DELETE(_request: Request, { params }: Params) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: { fotos: true },
  });

  if (!property) {
    return NextResponse.json(
      { erro: "Imóvel não encontrado." },
      { status: 404 }
    );
  }

  try {
    // Primeiro o banco (cascade remove PropertyPhoto), depois o storage
    await prisma.property.delete({ where: { id: params.id } });
    await deletePropertyPhotos(property.fotos.map((f) => f.storageKey));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/properties DELETE]", e);
    return NextResponse.json(
      { erro: "Erro ao excluir o imóvel. Tente novamente." },
      { status: 500 }
    );
  }
}
