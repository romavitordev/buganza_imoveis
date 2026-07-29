import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fila de perguntas sem resposta (/admin/suporte).
 *
 * PATCH { id, status } — tira da fila: RESPONDIDA (virou conhecimento)
 * ou IGNORADA (ruído, tipo "ola"/teste). Nada é apagado: o histórico
 * continua servindo de termômetro.
 */
export async function PATCH(request: Request) {
  const sessao = await getCurrentSession();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }
  const { id, status } =
    typeof body === "object" && body !== null
      ? (body as { id?: unknown; status?: unknown })
      : {};

  if (typeof id !== "string" || !id) {
    return NextResponse.json({ erro: "Informe o id." }, { status: 400 });
  }
  if (status !== "IGNORADA" && status !== "RESPONDIDA" && status !== "NOVA") {
    return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
  }

  try {
    await prisma.chatPergunta.update({ where: { id }, data: { status } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/chatbot/perguntas PATCH]", e);
    return NextResponse.json({ erro: "Erro ao atualizar." }, { status: 500 });
  }
}
