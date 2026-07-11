import { NextResponse } from "next/server";
import { StatusLead } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/** PATCH — muda o status do lead (NOVO/CONTATADO/DESCARTADO). */
export async function PATCH(request: Request, { params }: Params) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { erro: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const status =
    typeof body === "object" && body !== null
      ? (body as { status?: unknown }).status
      : undefined;

  if (
    typeof status !== "string" ||
    !(Object.values(StatusLead) as string[]).includes(status)
  ) {
    return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: { status: status as StatusLead },
    });
    return NextResponse.json({ lead });
  } catch {
    return NextResponse.json(
      { erro: "Lead não encontrado." },
      { status: 404 }
    );
  }
}

/** DELETE — remove o lead definitivamente (LGPD: direito de exclusão). */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    await prisma.lead.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { erro: "Lead não encontrado." },
      { status: 404 }
    );
  }
}
