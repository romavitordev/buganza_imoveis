import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ROTA PÚBLICA — dados enxutos de um imóvel ATIVO para o chatbot
 * responder com informação real ("quanto custa?", "tem vaga?"…).
 *
 * Mesma regra inviolável do lib/dto.ts: allowlist campo a campo, sem
 * spread — `precoInterno` JAMAIS sai daqui. Sem fotos/descrição: o
 * payload fica pequeno (o visitante já está vendo a página do imóvel).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ erro: "Informe o slug." }, { status: 400 });
  }

  try {
    const p = await prisma.property.findUnique({
      where: { slug },
      select: {
        status: true,
        titulo: true,
        codigo: true,
        tipo: true,
        subtipo: true,
        transacao: true,
        cidade: true,
        bairro: true,
        quartos: true,
        suites: true,
        banheiros: true,
        vagas: true,
        areaM2: true,
        areaTerrenoM2: true,
        precoVenda: true,
        precoLocacao: true,
        condominioMensal: true,
        iptuAnual: true,
        comodidades: true,
      },
    });
    if (!p || p.status !== "ATIVO") {
      return NextResponse.json({ erro: "Imóvel não encontrado." }, { status: 404 });
    }

    return NextResponse.json(
      {
        imovel: {
          titulo: p.titulo,
          codigo: p.codigo,
          tipo: p.tipo,
          subtipo: p.subtipo,
          transacao: p.transacao,
          cidade: p.cidade,
          bairro: p.bairro,
          quartos: p.quartos,
          suites: p.suites,
          banheiros: p.banheiros,
          vagas: p.vagas,
          areaM2: p.areaM2,
          areaTerrenoM2: p.areaTerrenoM2,
          precoVenda: p.precoVenda?.toString() ?? null,
          precoLocacao: p.precoLocacao?.toString() ?? null,
          condominioMensal: p.condominioMensal?.toString() ?? null,
          iptuAnual: p.iptuAnual?.toString() ?? null,
          comodidades: p.comodidades ?? [],
        },
      },
      {
        // Dado público e estável: o CDN pode segurar por alguns minutos.
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      }
    );
  } catch (e) {
    console.error("[chatbot/imovel]", e);
    return NextResponse.json({ erro: "Erro ao consultar." }, { status: 500 });
  }
}
