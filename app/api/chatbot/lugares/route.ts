import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ROTA PÚBLICA — bairros e cidades que EXISTEM no catálogo ativo.
 *
 * O chatbot usa esta lista para reconhecer lugares na conversa
 * ("apartamento no Campolim"). Sem ela, seria preciso chutar nomes de
 * bairro — aqui o vocabulário vem do próprio banco, então o bot só
 * reconhece o que a imobiliária realmente anuncia.
 *
 * Só nomes (nenhum dado de imóvel), com cache de CDN: a lista muda
 * pouco e é consultada a cada abertura de chat.
 */
export async function GET() {
  try {
    const [bairros, cidades] = await Promise.all([
      prisma.property
        .findMany({
          where: { status: "ATIVO" },
          select: { bairro: true },
          distinct: ["bairro"],
          orderBy: { bairro: "asc" },
        })
        .then((linhas) => linhas.map((l) => l.bairro).filter(Boolean)),
      prisma.property
        .findMany({
          where: { status: "ATIVO" },
          select: { cidade: true },
          distinct: ["cidade"],
          orderBy: { cidade: "asc" },
        })
        .then((linhas) => linhas.map((l) => l.cidade).filter(Boolean)),
    ]);

    return NextResponse.json(
      { bairros, cidades },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
        },
      }
    );
  } catch (e) {
    console.error("[chatbot/lugares]", e);
    // Lista vazia degrada bem: o bot só perde o filtro por lugar
    return NextResponse.json({ bairros: [], cidades: [] });
  }
}
