import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "bz_admin";
const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 horas

export interface SessionPayload {
  sub: string; // id do AdminUser
  email: string;
  nome: string;
}

/**
 * AUTH_SECRET é obrigatório — sem fallback hardcoded.
 * O erro é lançado na primeira utilização (login/verificação),
 * o que na prática impede qualquer sessão de existir sem o segredo.
 */
export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET ausente ou muito curto. Defina AUTH_SECRET no .env (mínimo 16 caracteres) — o admin não funciona sem ele."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({ email: payload.email, nome: payload.nome })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      sub: payload.sub,
      email: payload.email,
      nome: typeof payload.nome === "string" ? payload.nome : "",
    };
  } catch {
    return null;
  }
}

/** Grava o cookie httpOnly da sessão (usar apenas em Route Handlers / Server Actions). */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

/** Lê e valida a sessão atual a partir dos cookies (server-side). */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Exige sessão de admin numa página do painel (server component) — segunda
 * camada além do middleware.ts (defense in depth): se o middleware não
 * rodar por qualquer motivo, a página redireciona para o login antes de
 * renderizar qualquer dado. Retorna a sessão para uso na página.
 */
export async function exigirSessao(): Promise<SessionPayload> {
  const sessao = await getCurrentSession();
  if (!sessao) redirect("/admin/login");
  return sessao;
}

/**
 * Guarda das ROTAS DE API do admin. Devolve `null` quando há sessão, ou
 * a resposta 401 já pronta para o handler entregar:
 *
 *     const barrado = await barrarSemSessao();
 *     if (barrado) return barrado;
 *
 * É o equivalente do `exigirSessao` para APIs — lá o redirect resolve,
 * aqui a resposta precisa ser JSON com status.
 *
 * POR QUE EXISTE, se o middleware.ts já protege /api/admin: porque o
 * middleware é UMA linha de defesa, e frágil por natureza. Ela vive num
 * `matcher` de string — basta mover uma rota para fora de /api/admin,
 * editar o matcher sem perceber, ou o framework mudar de comportamento,
 * e a proteção some sem erro nenhum aparecer. A rota simplesmente passa
 * a responder para qualquer um. O próprio Next já teve CVE de bypass de
 * middleware (o 14.2.35 daqui está corrigido, mas o histórico é o
 * argumento).
 *
 * Com a checagem também no handler, perder o middleware vira um
 * inconveniente em vez de vazar o painel inteiro.
 */
export async function barrarSemSessao(): Promise<Response | null> {
  const sessao = await getCurrentSession();
  if (sessao) return null;
  return Response.json(
    { erro: "Não autenticado. Faça login para continuar." },
    { status: 401 }
  );
}
