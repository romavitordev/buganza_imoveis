import { NextResponse } from "next/server";
import type { PropertyPhoto } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  chaveNovaFoto,
  chaveNovoVideo,
  criarUploadAssinado,
  deletePropertyVideo,
  urlPublicaDaChave,
} from "@/lib/storage";
import { revalidarPaginasPublicas } from "@/lib/revalidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

interface Params {
  params: { id: string };
}

/**
 * Upload DIRETO navegador → Supabase, em duas etapas:
 *
 *   POST  → valida e devolve a URL assinada (o arquivo não passa pela Vercel,
 *           então o limite de 4,5 MB de body das functions não se aplica)
 *   PUT   → confirma a chave enviada e registra no banco (foto ou vídeo)
 *
 * Sem Supabase configurado (dev), o POST responde { fallback: true } e o
 * cliente usa as rotas multipart de sempre (que gravam em public/uploads).
 */
export async function POST(request: Request, { params }: Params) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!property) {
    return NextResponse.json(
      { erro: "Imóvel não encontrado." },
      { status: 404 }
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

  const { kind, fileName, contentType, tamanho } =
    typeof body === "object" && body !== null
      ? (body as {
          kind?: unknown;
          fileName?: unknown;
          contentType?: unknown;
          tamanho?: unknown;
        })
      : {};

  if (
    (kind !== "foto" && kind !== "video") ||
    typeof fileName !== "string" ||
    typeof contentType !== "string" ||
    typeof tamanho !== "number"
  ) {
    return NextResponse.json(
      { erro: "Informe kind ('foto' | 'video'), fileName, contentType e tamanho." },
      { status: 400 }
    );
  }

  // Mesmas regras de validação do upload via servidor
  if (kind === "foto") {
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { erro: `"${fileName}" não é uma imagem válida.` },
        { status: 400 }
      );
    }
    if (tamanho > MAX_FOTO_BYTES) {
      return NextResponse.json(
        { erro: `"${fileName}" excede o limite de 5 MB.` },
        { status: 400 }
      );
    }
  } else {
    if (!contentType.startsWith("video/")) {
      return NextResponse.json(
        { erro: `"${fileName}" não é um vídeo válido (use MP4, WebM ou MOV).` },
        { status: 400 }
      );
    }
    if (tamanho > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { erro: `"${fileName}" excede o limite de 50 MB.` },
        { status: 400 }
      );
    }
  }

  const arquivo = { name: fileName, type: contentType };
  const storageKey =
    kind === "foto"
      ? chaveNovaFoto(property.id, arquivo)
      : chaveNovoVideo(property.id, arquivo);

  try {
    const assinado = await criarUploadAssinado(storageKey);
    if (!assinado) {
      // Dev sem Supabase → cliente cai para o upload multipart local
      return NextResponse.json({ fallback: true });
    }
    return NextResponse.json(assinado);
  } catch (e) {
    console.error("[admin/uploads POST]", e);
    return NextResponse.json(
      { erro: "Erro ao preparar o upload. Tente novamente." },
      { status: 500 }
    );
  }
}

/** PUT — confirma upload(s) direto(s) e registra no banco. */
export async function PUT(request: Request, { params }: Params) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { id: true, slug: true, videoStorageKey: true },
  });
  if (!property) {
    return NextResponse.json(
      { erro: "Imóvel não encontrado." },
      { status: 404 }
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

  const { kind, storageKeys } =
    typeof body === "object" && body !== null
      ? (body as { kind?: unknown; storageKeys?: unknown })
      : {};

  const chaves =
    Array.isArray(storageKeys) &&
    storageKeys.every((k): k is string => typeof k === "string")
      ? storageKeys
      : null;

  if ((kind !== "foto" && kind !== "video") || !chaves || chaves.length === 0) {
    return NextResponse.json(
      { erro: "Informe kind ('foto' | 'video') e storageKeys." },
      { status: 400 }
    );
  }

  // Segurança: só aceita chaves DENTRO da pasta deste imóvel — impede
  // registrar (ou sobrescrever) arquivos de outros anúncios
  const prefixo = `properties/${property.id}/`;
  if (chaves.some((k) => !k.startsWith(prefixo) || k.includes(".."))) {
    return NextResponse.json(
      { erro: "Chave de storage inválida para este imóvel." },
      { status: 400 }
    );
  }

  try {
    if (kind === "video") {
      const storageKey = chaves[0];
      // Primeiro o banco, depois o storage: se o update falhar, o vídeo
      // antigo continua íntegro (apagar antes deixaria a URL órfã)
      const atualizado = await prisma.property.update({
        where: { id: property.id },
        data: {
          videoUrl: urlPublicaDaChave(storageKey),
          videoStorageKey: storageKey,
        },
        select: { videoUrl: true },
      });
      if (property.videoStorageKey) {
        await deletePropertyVideo(property.videoStorageKey);
      }
      revalidarPaginasPublicas(property.slug);
      return NextResponse.json({ videoUrl: atualizado.videoUrl }, { status: 201 });
    }

    const [totalExistente, ultima] = await Promise.all([
      prisma.propertyPhoto.count({ where: { propertyId: property.id } }),
      prisma.propertyPhoto.findFirst({
        where: { propertyId: property.id },
        orderBy: { ordem: "desc" },
        select: { ordem: true },
      }),
    ]);
    let proximaOrdem = ultima ? ultima.ordem + 1 : 0;

    const criadas: PropertyPhoto[] = [];
    for (const storageKey of chaves) {
      const foto = await prisma.propertyPhoto.create({
        data: {
          propertyId: property.id,
          url: urlPublicaDaChave(storageKey),
          storageKey,
          ordem: proximaOrdem++,
          // Primeira foto do imóvel vira capa automaticamente
          capa: totalExistente === 0 && criadas.length === 0,
        },
      });
      criadas.push(foto);
    }

    revalidarPaginasPublicas(property.slug);
    return NextResponse.json({ fotos: criadas }, { status: 201 });
  } catch (e) {
    console.error("[admin/uploads PUT]", e);
    return NextResponse.json(
      { erro: "Erro ao registrar o upload. Tente novamente." },
      { status: 500 }
    );
  }
}
