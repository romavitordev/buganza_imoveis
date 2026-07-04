import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { proximoCodigo } from "@/lib/codigo";
import { uniqueSlug, slugify } from "@/lib/slug";
import {
  parsePropertyInput,
  isValidationError,
} from "@/lib/property-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — lista todos os imóveis (todos os status) para o dashboard. */
export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { atualizadoEm: "desc" },
      include: { fotos: { orderBy: { ordem: "asc" } } },
    });
    return NextResponse.json({ properties });
  } catch (e) {
    console.error("[admin/properties GET]", e);
    return NextResponse.json(
      { erro: "Erro ao listar imóveis. Tente novamente." },
      { status: 500 }
    );
  }
}

/** POST — cria um imóvel com código sequencial e slug único. */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { erro: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const input = parsePropertyInput(payload);
  if (isValidationError(input)) {
    return NextResponse.json(input, { status: 400 });
  }

  try {
    const slug = await uniqueSlug(input.slug ?? slugify(input.titulo));

    const property = await prisma.$transaction(async (tx) => {
      const codigo = await proximoCodigo(tx);
      return tx.property.create({
        data: {
          codigo,
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
        include: { fotos: true },
      });
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (e) {
    console.error("[admin/properties POST]", e);
    return NextResponse.json(
      { erro: "Erro ao criar o imóvel. Tente novamente." },
      { status: 500 }
    );
  }
}
