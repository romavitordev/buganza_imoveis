import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ipDaRequisicao } from "@/lib/ratelimit";
import { registrarEventoUnico, normalizarOrigem } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rota PÚBLICA de analytics: registra VISUALIZAÇÕES da página do imóvel
 * (beacon do cliente ao abrir o detalhe). Os cliques de WhatsApp são
 * contabilizados no servidor pela rota /api/contato.
 *
 * Nunca retorna erro "barulhento" — analytics não pode quebrar o site.
 */

// Limite leve por IP (60 eventos/min) contra flood acidental ou malicioso
const JANELA_MS = 60 * 1000;
const MAX_EVENTOS = 60;
const contadores = new Map<string, { total: number; inicio: number }>();

function dentroDoLimite(ip: string): boolean {
  const agora = Date.now();
  const registro = contadores.get(ip);
  if (contadores.size > 2000) {
    Array.from(contadores.entries()).forEach(([chave, valor]) => {
      if (agora - valor.inicio > JANELA_MS) contadores.delete(chave);
    });
  }
  if (!registro || agora - registro.inicio > JANELA_MS) {
    contadores.set(ip, { total: 1, inicio: agora });
    return true;
  }
  registro.total++;
  return registro.total <= MAX_EVENTOS;
}

export async function POST(request: Request) {
  try {
    const ip = ipDaRequisicao(request);
    if (!dentroDoLimite(ip)) {
      return NextResponse.json({ ok: true });
    }

    const body = (await request.json().catch(() => null)) as {
      slug?: unknown;
      tipo?: unknown;
      origem?: unknown;
    } | null;

    const slug = typeof body?.slug === "string" ? body.slug : null;
    // Esta rota só registra visualizações; cliques vêm por /api/contato.
    if (!slug || body?.tipo !== "visualizacao") {
      return NextResponse.json({ ok: true });
    }

    const property = await prisma.property.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!property || property.status !== "ATIVO") {
      return NextResponse.json({ ok: true });
    }

    await registrarEventoUnico(
      request,
      property.id,
      "VISUALIZACAO",
      normalizarOrigem(body?.origem)
    );
  } catch (e) {
    console.error("[track]", e);
  }
  return NextResponse.json({ ok: true });
}
