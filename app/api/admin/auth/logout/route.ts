import { NextResponse } from "next/server";
import { SESSION_COOKIE, barrarSemSessao } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const barrado = await barrarSemSessao();
  if (barrado) return barrado;

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
