import { NextResponse } from "next/server";
import { StatusImovel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { uniqueSlug, slugify } from "@/lib/slug";
import { deletePropertyPhotos } from "@/lib/storage";
import {
  parsePropertyInput,
  isValidationError,
} from "@/lib/property-input";
import { revalidarPaginasPublicas } from "@/lib/revalidate";
import { barrarSemSessao } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/** PATCH — edita um imóvel. Aceita payload completo ou só { destaque } / { status }. */
export async function PATCH(request: Request, { params }: Params) {
  const barrado = await barrarSemSessao();
  if (barrado) return barrado;

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
    select: { id: true, titulo: true, slug: true },
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
    revalidarPaginasPublicas(property.slug);
    return NextResponse.json({ property });
  }

  // Atualização rápida de status (marcar VENDIDO direto na tabela)
  if (
    typeof payload === "object" &&
    payload !== null &&
    Object.keys(payload).length === 1 &&
    "status" in payload
  ) {
    const status = (payload as { status: unknown }).status;
    if (
      typeof status !== "string" ||
      !(Object.values(StatusImovel) as string[]).includes(status)
    ) {
      return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
    }
    const property = await prisma.property.update({
      where: { id: params.id },
      data: { status: status as StatusImovel },
      include: { fotos: { orderBy: { ordem: "asc" } } },
    });
    revalidarPaginasPublicas(property.slug);
    return NextResponse.json({ property });
  }

  const input = parsePropertyInput(payload);
  if (isValidationError(input)) {
    return NextResponse.json(input, { status: 400 });
  }

  try {
    /**
     * O ENDEREÇO NÃO MUDA DEPOIS DE CRIADO.
     *
     * Antes, o slug era recalculado a cada edição: mandando um `slug`
     * diferente — ou nenhum, caindo no título — o endereço trocava e o
     * anterior passava a dar 404, derrubando todo link já enviado no
     * WhatsApp sem aviso nenhum.
     *
     * O formulário já não deixa editar o campo, mas travar só a tela
     * deixaria a rota aberta para qualquer requisição direta, e é a
     * rota que grava. A regra vive aqui.
     *
     * Quem quiser um endereço curto e estável tem o código do imóvel:
     * /imoveis/MIS-0001 abre a mesma página.
     */
    const atual = await prisma.property.findUnique({
      where: { id: params.id },
      select: { slug: true },
    });
    const slug = atual
      ? atual.slug
      : await uniqueSlug(input.slug ?? slugify(input.titulo), params.id);

    const property = await prisma.property.update({
      where: { id: params.id },
      data: {
        slug,
        titulo: input.titulo,
        descricao: input.descricao,
        tipo: input.tipo,
        subtipo: input.subtipo,
        transacao: input.transacao,
        status: input.status,
        destaque: input.destaque,
        cidade: input.cidade,
        bairro: input.bairro,
        enderecoMapa: input.enderecoMapa,
        quartos: input.quartos,
        suites: input.suites,
        banheiros: input.banheiros,
        vagas: input.vagas,
        areaM2: input.areaM2,
        areaTerrenoM2: input.areaTerrenoM2,
        precoVenda: input.precoVenda,
        precoLocacao: input.precoLocacao,
        precoInterno: input.precoInterno,
        condominioMensal: input.condominioMensal,
        iptuAnual: input.iptuAnual,
        comodidades: input.comodidades,
      },
      include: { fotos: { orderBy: { ordem: "asc" } } },
    });

    // slug pode mudar na edição — invalida a página antiga e a nova
    revalidarPaginasPublicas(existente.slug, property.slug);
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
  const barrado = await barrarSemSessao();
  if (barrado) return barrado;

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
    revalidarPaginasPublicas(property.slug);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/properties DELETE]", e);
    return NextResponse.json(
      { erro: "Erro ao excluir o imóvel. Tente novamente." },
      { status: 500 }
    );
  }
}
