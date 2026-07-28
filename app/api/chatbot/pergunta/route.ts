import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitar, ipDaRequisicao } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ROTA PÚBLICA — registra perguntas do chat que caíram no fallback
 * ("não sei responder"). É a matéria-prima para evoluir a base do bot:
 * o painel mostra o que os visitantes realmente perguntam.
 *
 * Privacidade: grava SÓ o texto da pergunta (máx. 200 chars), sem nome,
 * IP ou qualquer identificador do visitante. Limite de 10/h por IP
 * (durável com Upstash — lib/ratelimit).
 */

export async function POST(request: Request) {
  // Limite estourado responde "ok" mesmo assim: é telemetria, não vale a
  // pena dar dica de rate limit a um bot.
  const limite = await limitar(
    `chatpergunta:${ipDaRequisicao(request)}`,
    10,
    60 * 60 * 1000
  );
  if (!limite.permitido) {
    return NextResponse.json({ ok: true });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const texto =
    typeof body === "object" && body !== null && "texto" in body
      ? String((body as { texto: unknown }).texto ?? "").trim()
      : "";
  if (texto.length < 3) {
    return NextResponse.json({ erro: "Pergunta muito curta." }, { status: 400 });
  }

  try {
    await prisma.chatPergunta.create({ data: { texto: texto.slice(0, 200) } });
  } catch (e) {
    // Telemetria nunca vira erro para o visitante
    console.error("[chatbot/pergunta]", e);
  }
  return NextResponse.json({ ok: true });
}
