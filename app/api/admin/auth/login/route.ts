import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/session";
import {
  verificarRateLimit,
  limparRateLimit,
  ipDaRequisicao,
} from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = ipDaRequisicao(request);
  const limite = verificarRateLimit(ip);

  if (!limite.permitido) {
    const minutos = Math.max(1, Math.ceil(limite.liberaEmSegundos / 60));
    return NextResponse.json(
      {
        erro: `Muitas tentativas de login. Tente novamente em ${minutos} minuto(s).`,
      },
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

  const { email, password } =
    typeof body === "object" && body !== null
      ? (body as { email?: unknown; password?: unknown })
      : {};

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { erro: "Informe e-mail e senha." },
      { status: 400 }
    );
  }

  const user = await prisma.adminUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // Compara mesmo se o usuário não existir (tempo constante contra enumeração)
  const hashParaComparar =
    user?.passwordHash ??
    "$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZBpDLhKuVXOOhFcrDHm9r0d5PZJONa";
  const senhaCorreta = await bcrypt.compare(password, hashParaComparar);

  if (!user || !senhaCorreta) {
    return NextResponse.json(
      { erro: "E-mail ou senha incorretos." },
      { status: 401 }
    );
  }

  limparRateLimit(ip);

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    nome: user.nome,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
