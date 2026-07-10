import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { proximoCodigo } from "@/lib/codigo";
import { uniqueSlug } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/**
 * POST — duplica um imóvel (caso comum: várias unidades no mesmo prédio).
 * A cópia nasce PAUSADA, sem destaque, sem fotos e sem vídeo — o corretor
 * ajusta o que muda e publica quando estiver pronta.
 */
export async function POST(_request: Request, { params }: Params) {
  const original = await prisma.property.findUnique({
    where: { id: params.id },
  });

  if (!original) {
    return NextResponse.json(
      { erro: "Imóvel não encontrado." },
      { status: 404 }
    );
  }

  try {
    const titulo = `${original.titulo} (cópia)`;
    const slug = await uniqueSlug(titulo);

    const copia = await prisma.$transaction(async (tx) => {
      const codigo = await proximoCodigo(tx);
      return tx.property.create({
        data: {
          codigo,
          slug,
          titulo,
          descricao: original.descricao,
          tipo: original.tipo,
          subtipo: original.subtipo,
          transacao: original.transacao,
          status: "PAUSADO",
          destaque: false,
          cidade: original.cidade,
          bairro: original.bairro,
          enderecoMapa: original.enderecoMapa,
          quartos: original.quartos,
          suites: original.suites,
          banheiros: original.banheiros,
          vagas: original.vagas,
          areaM2: original.areaM2,
          areaTerrenoM2: original.areaTerrenoM2,
          precoVenda: original.precoVenda,
          precoLocacao: original.precoLocacao,
          precoInterno: original.precoInterno,
          condominioMensal: original.condominioMensal,
          iptuAnual: original.iptuAnual,
          comodidades: original.comodidades,
        },
      });
    });

    // Nasce PAUSADO — nada a revalidar no site público
    return NextResponse.json({ property: copia }, { status: 201 });
  } catch (e) {
    console.error("[admin/duplicate POST]", e);
    return NextResponse.json(
      { erro: "Erro ao duplicar o imóvel. Tente novamente." },
      { status: 500 }
    );
  }
}
