import "server-only";
import { createHash } from "crypto";
import type { TipoEvento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ipDaRequisicao } from "@/lib/ratelimit";

/**
 * Registro de eventos de analytics — SEMPRE no servidor.
 *
 * Privacidade (LGPD): o IP nunca é gravado. Ele vira um hash SHA-256
 * (IP + navegador + imóvel) usado apenas para deduplicar o mesmo
 * dispositivo no mesmo dia. O contexto guardado é anônimo: tipo de
 * dispositivo e origem do acesso.
 */

export function detectarDispositivo(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) return "TABLET";
  if (/mobile|iphone|android/.test(ua)) return "MOBILE";
  return "DESKTOP";
}

/** Normaliza a origem: aceita utm_source ou hostname do referrer. */
export function normalizarOrigem(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const texto = valor.trim().toLowerCase().slice(0, 60);
  if (!texto) return null;
  const semProtocolo = texto.replace(/^https?:\/\//, "").split("/")[0];
  return semProtocolo.replace(/^www\./, "") || null;
}

/**
 * Registra um evento único por dispositivo/imóvel/tipo/dia.
 * Nunca lança — analytics não pode quebrar o fluxo do usuário.
 */
export async function registrarEventoUnico(
  request: Request,
  propertyId: string,
  tipo: TipoEvento,
  origem: string | null
): Promise<void> {
  try {
    const ip = ipDaRequisicao(request);
    const userAgent = request.headers.get("user-agent") ?? "";

    const dedupeHash = createHash("sha256")
      .update(`${ip}|${userAgent}|${propertyId}`)
      .digest("hex");

    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);

    const jaRegistrado = await prisma.propertyEvent.findFirst({
      where: { dedupeHash, tipo, criadoEm: { gte: inicioDoDia } },
      select: { id: true },
    });

    if (!jaRegistrado) {
      await prisma.propertyEvent.create({
        data: {
          propertyId,
          tipo,
          dispositivo: detectarDispositivo(userAgent),
          origem,
          dedupeHash,
        },
      });
    }
  } catch (e) {
    console.error("[analytics]", e);
  }
}

/** Origem a partir do cabeçalho Referer da requisição (fallback do server). */
export function origemDoReferer(request: Request): string | null {
  return normalizarOrigem(request.headers.get("referer"));
}
