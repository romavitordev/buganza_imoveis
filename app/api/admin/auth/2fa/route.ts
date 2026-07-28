import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { gerarSegredoTotp, qrCodeTotp, verificarCodigoTotp } from "@/lib/totp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Gerenciamento da 2FA (TOTP) do admin logado. Protegida pelo middleware
 * (/api/admin) + checagem de sessão aqui (defense in depth).
 *
 * Ações (POST { acao, codigo? }):
 *   iniciar   → gera segredo pendente e devolve o QR para o app
 *   confirmar → valida o 1º código e ATIVA a 2FA
 *   desativar → exige um código válido para desligar
 *
 * O segredo só transita na ativação (QR); depois, jamais sai do servidor.
 */
export async function POST(request: Request) {
  const sessao = await getCurrentSession();
  if (!sessao) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }
  const { acao, codigo } =
    typeof body === "object" && body !== null
      ? (body as { acao?: unknown; codigo?: unknown })
      : {};

  const user = await prisma.adminUser.findUnique({
    where: { id: sessao.sub },
  });
  if (!user) {
    return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
  }

  if (acao === "iniciar") {
    if (user.totpAtivadoEm) {
      return NextResponse.json(
        { erro: "A verificação em duas etapas já está ativa." },
        { status: 400 }
      );
    }
    const segredo = gerarSegredoTotp();
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { totpSecret: segredo, totpAtivadoEm: null },
    });
    const qr = await qrCodeTotp(user.email, segredo);
    return NextResponse.json({ qr, segredo });
  }

  if (acao === "confirmar") {
    if (!user.totpSecret || user.totpAtivadoEm) {
      return NextResponse.json(
        { erro: "Inicie a configuração primeiro." },
        { status: 400 }
      );
    }
    if (
      typeof codigo !== "string" ||
      !verificarCodigoTotp(codigo, user.totpSecret)
    ) {
      return NextResponse.json(
        { erro: "Código inválido. Confira o app e tente o código atual." },
        { status: 400 }
      );
    }
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { totpAtivadoEm: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (acao === "desativar") {
    if (!user.totpAtivadoEm || !user.totpSecret) {
      return NextResponse.json(
        { erro: "A verificação em duas etapas não está ativa." },
        { status: 400 }
      );
    }
    if (
      typeof codigo !== "string" ||
      !verificarCodigoTotp(codigo, user.totpSecret)
    ) {
      return NextResponse.json(
        { erro: "Código inválido. Para desativar, confirme o código atual." },
        { status: 400 }
      );
    }
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { totpSecret: null, totpAtivadoEm: null },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ erro: "Ação desconhecida." }, { status: 400 });
}
