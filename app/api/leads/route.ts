import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ipDaRequisicao } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ROTA PÚBLICA — recebe o formulário "Tenho interesse" do detalhe do
 * imóvel. Proteções: honeypot (campo "site" precisa vir vazio), limite
 * de 5 envios por IP por hora e validação estrita dos campos.
 *
 * LGPD: só grava o que o visitante digitou, com consentimento explícito
 * no formulário, para a finalidade única de retornar o contato.
 */

const JANELA_MS = 60 * 60 * 1000;
const MAX_POR_JANELA = 5;
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
  if (excedeuLimite(ipDaRequisicao(request))) {
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
  if (typeof slug === "string" && slug) {
    const property = await prisma.property.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });
    if (property?.status === "ATIVO") propertyId = property.id;
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
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("[leads POST]", e);
    return NextResponse.json(
      { erro: "Erro ao enviar. Tente novamente ou chame no WhatsApp." },
      { status: 500 }
    );
  }
}
