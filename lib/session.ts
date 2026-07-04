import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

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
