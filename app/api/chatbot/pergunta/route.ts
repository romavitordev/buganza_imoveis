import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ipDaRequisicao } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ROTA PÚBLICA — registra perguntas do chat que caíram no fallback
 * ("não sei responder"). É a matéria-prima para evoluir a base do bot:
 * o painel mostra o que os visitantes realmente perguntam.
 *
 * Privacidade: grava SÓ o texto da pergunta (máx. 200 chars), sem nome,
 * IP ou qualquer identificador do visitante.
 */

const JANELA_MS = 60 * 60 * 1000;
const MAX_POR_JANELA = 10;
const envios = new Map<string, { total: number; inicioJanela: number }>();

function excedeuLimite(ip: string): boolean {
  const agora = Date.now();
  if (envios.size > 1000) {
    Array.from(envios.entries()).forEach(([chave, valor]) => {
      if (agora - valor.inicioJanela > JANELA_MS) envios.delete(chave);
    });
  }
  const registro = envios.get(ip);
  if (!registro || agora - registro.inicioJanela > JANELA_MS) {
    envios.set(ip, { total: 1, inicioJanela: agora });
    return false;
  }
  registro.total++;
  return registro.total > MAX_POR_JANELA;
}

export async function POST(request: Request) {
  // Limite estourado responde "ok" mesmo assim: é telemetria, não vale a
  // pena dar dica de rate limit a um bot.
  if (excedeuLimite(ipDaRequisicao(request))) {
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
