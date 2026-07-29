import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ROTA PÚBLICA — respostas que os corretores escreveram em /admin/suporte.
 * O widget junta estas com os tópicos fixos de lib/chatbot.ts, então a
 * base do bot cresce sem precisar de deploy.
 *
 * Só o necessário para responder (nada de datas ou contadores), com
 * cache de CDN: muda pouco e é lido a cada abertura de chat.
 */
export async function GET() {
  try {
    const itens = await prisma.chatConhecimento.findMany({
      where: { ativo: true },
      orderBy: { criadoEm: "asc" },
      select: { id: true, titulo: true, palavras: true, resposta: true },
    });

    return NextResponse.json(
      {
        topicos: itens.map((i) => ({
          id: i.id,
          titulo: i.titulo,
          chaves: i.palavras,
          resposta: i.resposta,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
        },
      }
    );
  } catch (e) {
    console.error("[chatbot/conhecimento]", e);
    // Lista vazia degrada bem: o bot volta a usar só os tópicos fixos
    return NextResponse.json({ topicos: [] });
  }
}
