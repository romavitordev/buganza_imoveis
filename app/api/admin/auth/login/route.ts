import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/session";
import { limitar, liberar, ipDaRequisicao } from "@/lib/ratelimit";
import { decifrarSegredo, verificarCodigoTotp } from "@/lib/totp";

export const runtime = "nodejs";

/** 5 tentativas por IP a cada 15 minutos (durável com Upstash). */
const LOGIN_MAX = 5;
const LOGIN_JANELA_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = ipDaRequisicao(request);
  const limite = await limitar(`login:${ip}`, LOGIN_MAX, LOGIN_JANELA_MS);

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

  const { email, password, codigo } =
    typeof body === "object" && body !== null
      ? (body as { email?: unknown; password?: unknown; codigo?: unknown })
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

  // 2FA (TOTP): quando ativado, a senha sozinha não basta. As tentativas
  // de código passam pelo MESMO rate limit do login (só é limpo no fim).
  if (user.totpAtivadoEm && user.totpSecret) {
    if (typeof codigo !== "string" || codigo.trim() === "") {
      return NextResponse.json(
        {
          requer2fa: true,
          erro: "Digite o código de 6 dígitos do seu app autenticador.",
        },
        { status: 401 }
      );
    }
    // Segredo cifrado em repouso: falha ao decifrar NUNCA libera o login
    const segredo = decifrarSegredo(user.totpSecret);
    if (!segredo || !verificarCodigoTotp(codigo, segredo)) {
      return NextResponse.json(
        { requer2fa: true, erro: "Código inválido ou expirado. Tente o atual." },
        { status: 401 }
      );
    }
  }

  await liberar(`login:${ip}`);

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    nome: user.nome,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
