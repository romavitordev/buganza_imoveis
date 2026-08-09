import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { barrarSemSessao } from "@/lib/session";
import { palavrasChaveDe } from "@/lib/chatbot-aprendizado";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Gestão da base aprendida do chatbot (/admin/suporte). Protegida pelo
 * middleware (/api/admin) + barrarSemSessao em cada handler, como todas
 * as rotas do painel (defense in depth — ver lib/session.ts).
 *
 * POST   — cria uma resposta (e marca a pergunta de origem como RESPONDIDA)
 * PATCH  — edita ou (des)ativa uma resposta existente
 * DELETE — remove uma resposta
 */

export async function POST(request: Request) {
  const barrado = await barrarSemSessao();
  if (barrado) return barrado;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }
  const { titulo, resposta, palavras, perguntaId } =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  const tituloLimpo =
    typeof titulo === "string" ? titulo.trim().slice(0, 80) : "";
  const respostaLimpa =
    typeof resposta === "string" ? resposta.trim().slice(0, 1500) : "";

  if (tituloLimpo.length < 3) {
    return NextResponse.json(
      { erro: "Dê um título curto ao assunto (ex.: “Administração de condomínio”)." },
      { status: 400 }
    );
  }
  if (respostaLimpa.length < 10) {
    return NextResponse.json(
      { erro: "Escreva a resposta que o bot deve dar." },
      { status: 400 }
    );
  }

  // Palavras-chave: as informadas pelo corretor ou, se vazio, extraídas
  // do título + da pergunta original
  const informadas = Array.isArray(palavras)
    ? palavras.filter((p): p is string => typeof p === "string")
    : typeof palavras === "string"
      ? palavras.split(",")
      : [];
  const chaves = palavrasChaveDe(informadas.join(","), tituloLimpo);

  if (chaves.length === 0) {
    return NextResponse.json(
      { erro: "Informe ao menos uma palavra-chave que ative essa resposta." },
      { status: 400 }
    );
  }

  try {
    const criado = await prisma.chatConhecimento.create({
      data: { titulo: tituloLimpo, resposta: respostaLimpa, palavras: chaves },
    });

    // A pergunta que originou a resposta sai da fila de pendências
    if (typeof perguntaId === "string" && perguntaId) {
      await prisma.chatPergunta
        .update({ where: { id: perguntaId }, data: { status: "RESPONDIDA" } })
        .catch(() => {
          // Pergunta já resolvida/removida não invalida a resposta criada
        });
    }
    return NextResponse.json({ conhecimento: criado }, { status: 201 });
  } catch (e) {
    console.error("[admin/chatbot POST]", e);
    return NextResponse.json(
      { erro: "Erro ao salvar. Tente novamente." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const barrado = await barrarSemSessao();
  if (barrado) return barrado;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }
  const { id, titulo, resposta, palavras, ativo } =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ erro: "Informe o id." }, { status: 400 });
  }

  const dados: Record<string, unknown> = {};
  if (typeof titulo === "string" && titulo.trim().length >= 3) {
    dados.titulo = titulo.trim().slice(0, 80);
  }
  if (typeof resposta === "string" && resposta.trim().length >= 10) {
    dados.resposta = resposta.trim().slice(0, 1500);
  }
  if (palavras !== undefined) {
    const lista = Array.isArray(palavras)
      ? palavras.filter((p): p is string => typeof p === "string").join(",")
      : String(palavras);
    const chaves = palavrasChaveDe(lista, String(dados.titulo ?? ""));
    if (chaves.length > 0) dados.palavras = chaves;
  }
  if (typeof ativo === "boolean") dados.ativo = ativo;

  if (Object.keys(dados).length === 0) {
    return NextResponse.json({ erro: "Nada para atualizar." }, { status: 400 });
  }

  try {
    const atualizado = await prisma.chatConhecimento.update({
      where: { id },
      data: dados,
    });
    return NextResponse.json({ conhecimento: atualizado });
  } catch (e) {
    console.error("[admin/chatbot PATCH]", e);
    return NextResponse.json({ erro: "Erro ao atualizar." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const barrado = await barrarSemSessao();
  if (barrado) return barrado;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ erro: "Informe o id." }, { status: 400 });
  }
  try {
    await prisma.chatConhecimento.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/chatbot DELETE]", e);
    return NextResponse.json({ erro: "Erro ao remover." }, { status: 500 });
  }
}
