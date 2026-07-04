import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ipDaRequisicao } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rota PÚBLICA de analytics: registra visualizações da página do imóvel
 * e cliques nos botões de WhatsApp. Recebe beacons do client.
 * Nunca retorna erro "barulhento" — analytics não pode quebrar o site.
 *
 * Privacidade (LGPD):
 *  - o IP NUNCA é gravado; vira um hash SHA-256 (IP+navegador) usado só
 *    para deduplicar o mesmo dispositivo no mesmo dia;
 *  - o contexto capturado é anônimo: tipo de dispositivo e origem do acesso.
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

function detectarDispositivo(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) return "TABLET";
  if (/mobile|iphone|android/.test(ua)) return "MOBILE";
  return "DESKTOP";
}

/** Normaliza a origem: aceita utm_source ou hostname do referrer. */
function normalizarOrigem(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const texto = valor.trim().toLowerCase().slice(0, 60);
  if (!texto) return null;
  // remove protocolo/caminho caso venha uma URL inteira
  const semProtocolo = texto.replace(/^https?:\/\//, "").split("/")[0];
  return semProtocolo.replace(/^www\./, "") || null;
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

    if (!property || property.status !== "ATIVO") {
      return NextResponse.json({ ok: true });
    }

    const tipo = TIPOS_VALIDOS[tipoParam];
    const userAgent = request.headers.get("user-agent") ?? "";

    // Pseudônimo do dispositivo: hash de IP+UA+imóvel — o IP cru nunca é salvo
    const dedupeHash = createHash("sha256")
      .update(`${ip}|${userAgent}|${property.id}`)
      .digest("hex");

    // 1 evento por dispositivo, por imóvel, por tipo, por dia
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);

    const jaRegistrado = await prisma.propertyEvent.findFirst({
      where: {
        dedupeHash,
        tipo,
        criadoEm: { gte: inicioDoDia },
      },
      select: { id: true },
    });

    if (!jaRegistrado) {
      await prisma.propertyEvent.create({
        data: {
          propertyId: property.id,
          tipo,
          dispositivo: detectarDispositivo(userAgent),
          origem: normalizarOrigem(body?.origem),
          dedupeHash,
        },
      });
    }
  } catch (e) {
    console.error("[track]", e);
  }
  return NextResponse.json({ ok: true });
}
