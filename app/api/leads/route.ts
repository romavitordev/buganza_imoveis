import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitar, ipDaRequisicao } from "@/lib/ratelimit";
import { notificarLeadNovo } from "@/lib/notificar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ROTA PÚBLICA — recebe o contato deixado dentro do chat de
 * atendimento (ChatWidget). Proteções: honeypot (campo "site" precisa vir vazio), limite
 * de 5 envios por IP por hora (durável com Upstash — lib/ratelimit) e
 * validação estrita dos campos.
 *
 * LGPD: só grava o que o visitante digitou, com consentimento explícito
 * no formulário, para a finalidade única de retornar o contato.
 */

export async function POST(request: Request) {
  const limite = await limitar(
    `leads:${ipDaRequisicao(request)}`,
    5,
    60 * 60 * 1000
  );
  if (!limite.permitido) {
    return NextResponse.json(
      { erro: "Muitos envios em pouco tempo. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { erro: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const { nome, whatsapp, mensagem, slug, origem, site } =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  // Honeypot: humanos não veem esse campo; bot que preencher é descartado
  // com resposta de sucesso (não damos a dica)
  if (typeof site === "string" && site.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const nomeLimpo = typeof nome === "string" ? nome.trim().slice(0, 80) : "";
  if (nomeLimpo.length < 2) {
    return NextResponse.json({ erro: "Informe seu nome." }, { status: 400 });
  }

  const digitos =
    typeof whatsapp === "string" ? whatsapp.replace(/\D/g, "") : "";
  if (digitos.length < 10 || digitos.length > 13) {
    return NextResponse.json(
      { erro: "Informe um WhatsApp válido, com DDD." },
      { status: 400 }
    );
  }

  const mensagemLimpa =
    typeof mensagem === "string" ? mensagem.trim().slice(0, 500) : "";

  // Slug → imóvel (só ATIVO; lead sem imóvel também vale)
  let propertyId: string | null = null;
  let imovelDoLead: { titulo: string; codigo: string; slug: string } | null =
    null;
  if (typeof slug === "string" && slug) {
    const property = await prisma.property.findUnique({
      where: { slug },
      select: {
        id: true,
        status: true,
        titulo: true,
        codigo: true,
        slug: true,
      },
    });
    if (property?.status === "ATIVO") {
      propertyId = property.id;
      imovelDoLead = {
        titulo: property.titulo,
        codigo: property.codigo,
        slug: property.slug,
      };
    }
  }

  try {
    await prisma.lead.create({
      data: {
        propertyId,
        nome: nomeLimpo,
        whatsapp: digitos,
        mensagem: mensagemLimpa || null,
        origem:
          typeof origem === "string" && origem
            ? origem.slice(0, 60)
            : null,
      },
    });

    // Aviso ao corretor (Resend). Aguardado de propósito: em serverless,
    // trabalho "solto" após o return pode ser congelado. notificarLeadNovo
    // nunca lança e tem timeout de 5s — o lead já está salvo de todo jeito.
    await notificarLeadNovo({
      nome: nomeLimpo,
      whatsapp: digitos,
      mensagem: mensagemLimpa || null,
      origem: typeof origem === "string" && origem ? origem.slice(0, 60) : null,
      imovel: imovelDoLead,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("[leads POST]", e);
    return NextResponse.json(
      { erro: "Erro ao enviar. Tente novamente ou chame no WhatsApp." },
      { status: 500 }
    );
  }
}
