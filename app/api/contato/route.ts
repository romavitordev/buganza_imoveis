import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  whatsappUrl,
  MENSAGEM_GERAL,
  MENSAGEM_ANUNCIAR,
  mensagemImovel,
} from "@/lib/whatsapp-server";
import { registrarEventoUnico, origemDoReferer } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Redirecionador de contato do WhatsApp.
 *
 * O número e as mensagens são montados AQUI, no servidor, e a resposta é um
 * 302 para wa.me. O navegador só conhece /api/contato?ctx=... — o número
 * jamais chega ao bundle do cliente nem ao "inspecionar".
 *
 * Para ctx=imovel, o clique é contabilizado no servidor (mais confiável que
 * o beacon do cliente), com a mesma deduplicação por dispositivo/dia.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ctx = searchParams.get("ctx") ?? "geral";
  const slug = searchParams.get("slug");

  let mensagem = MENSAGEM_GERAL;

  if (ctx === "anunciar") {
    mensagem = MENSAGEM_ANUNCIAR;
  } else if (ctx === "imovel" && slug) {
    try {
      const imovel = await prisma.property.findUnique({
        where: { slug },
        select: { id: true, titulo: true, codigo: true, status: true },
      });
      if (imovel && imovel.status === "ATIVO") {
        mensagem = mensagemImovel(imovel.titulo, imovel.codigo);
        await registrarEventoUnico(
          request,
          imovel.id,
          "CLIQUE_WHATSAPP",
          origemDoReferer(request)
        );
      }
    } catch (e) {
      // Falha ao buscar/registrar não pode impedir o contato: segue com a
      // mensagem geral.
      console.error("[contato]", e);
    }
  }

  return NextResponse.redirect(whatsappUrl(mensagem), 302);
}
