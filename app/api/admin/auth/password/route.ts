import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST — troca a senha do admin logado (exige a senha atual). */
export async function POST(request: Request) {
  const sessao = await getCurrentSession();
  if (!sessao) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
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

  const { senhaAtual, novaSenha } =
    typeof body === "object" && body !== null
      ? (body as { senhaAtual?: unknown; novaSenha?: unknown })
      : {};

  if (typeof senhaAtual !== "string" || typeof novaSenha !== "string") {
    return NextResponse.json(
      { erro: "Informe a senha atual e a nova senha." },
      { status: 400 }
    );
  }
  if (novaSenha.length < 8) {
    return NextResponse.json(
      { erro: "A nova senha deve ter pelo menos 8 caracteres." },
      { status: 400 }
    );
  }
  if (novaSenha === senhaAtual) {
    return NextResponse.json(
      { erro: "A nova senha deve ser diferente da atual." },
      { status: 400 }
    );
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: sessao.sub },
  });
  if (!user) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  const confere = await bcrypt.compare(senhaAtual, user.passwordHash);
  if (!confere) {
    return NextResponse.json(
      { erro: "Senha atual incorreta." },
      { status: 400 }
    );
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(novaSenha, 12) },
  });

  return NextResponse.json({ ok: true });
}
