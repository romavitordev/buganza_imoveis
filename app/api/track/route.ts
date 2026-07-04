import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ipDaRequisicao } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rota PÚBLICA de analytics: registra visualizações da página do imóvel
 * e cliques nos botões de WhatsApp. Recebe beacons do client.
 * Nunca retorna erro "barulhento" — analytics não pode quebrar o site.
 */

const TIPOS_VALIDOS = {
  visualizacao: "VISUALIZACAO",
  clique_whatsapp: "CLIQUE_WHATSAPP",
} as const;

type TipoParam = keyof typeof TIPOS_VALIDOS;

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
    if (!dentroDoLimite(ipDaRequisicao(request))) {
      return NextResponse.json({ ok: true });
    }

    const body = (await request.json().catch(() => null)) as {
      slug?: unknown;
      tipo?: unknown;
    } | null;

    const slug = typeof body?.slug === "string" ? body.slug : null;
    const tipoParam =
      typeof body?.tipo === "string" && body.tipo in TIPOS_VALIDOS
        ? (body.tipo as TipoParam)
        : null;

    if (!slug || !tipoParam) {
      return NextResponse.json({ ok: true });
    }

    const property = await prisma.property.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (property && property.status === "ATIVO") {
      await prisma.propertyEvent.create({
        data: { propertyId: property.id, tipo: TIPOS_VALIDOS[tipoParam] },
      });
    }
  } catch (e) {
    console.error("[track]", e);
  }
  return NextResponse.json({ ok: true });
}
