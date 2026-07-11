"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Video } from "lucide-react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const MAX_TAMANHO_BYTES = 50 * 1024 * 1024;

interface VideoManagerProps {
  propertyId: string;
  videoUrlInicial: string | null;
}

/**
 * Vídeo do imóvel: um por anúncio, exibido apenas na página de detalhe
 * (nunca como capa do card ou nos destaques).
 */
export default function VideoManager({
  propertyId,
  videoUrlInicial,
}: VideoManagerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [videoUrl, setVideoUrl] = useState(videoUrlInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSelecionar(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;

    setErro(null);
    if (!arquivo.type.startsWith("video/")) {
      setErro(`"${arquivo.name}" não é um vídeo (use MP4, WebM ou MOV).`);
      return;
    }
    if (arquivo.size > MAX_TAMANHO_BYTES) {
      setErro(`"${arquivo.name}" excede o limite de 50 MB.`);
      return;
    }

    setEnviando(true);
    try {
      const contentType = arquivo.type || "application/octet-stream";

      // 1) Upload direto navegador → Supabase (produção): o vídeo de até
      //    50 MB nunca passaria pelo limite de 4,5 MB de body da Vercel
      const sign = await fetch(`/api/admin/properties/${propertyId}/uploads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "video",
          fileName: arquivo.name,
          contentType,
          tamanho: arquivo.size,
        }),
      });
      const signBody = (await sign.json().catch(() => null)) as {
        erro?: string;
        fallback?: boolean;
        uploadUrl?: string;
        storageKey?: string;
      } | null;
      if (!sign.ok) {
        throw new Error(signBody?.erro ?? "Erro ao preparar o envio.");
      }

      if (!signBody?.fallback && signBody?.uploadUrl && signBody.storageKey) {
        const upload = await fetch(signBody.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: arquivo,
        });
        if (!upload.ok) throw new Error("Falha no envio direto do vídeo.");

        const confirmar = await fetch(
          `/api/admin/properties/${propertyId}/uploads`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "video",
              storageKeys: [signBody.storageKey],
            }),
          }
        );
        const confirmado = (await confirmar.json().catch(() => null)) as {
          erro?: string;
          videoUrl?: string;
        } | null;
        if (!confirmar.ok) {
          throw new Error(confirmado?.erro ?? "Erro ao registrar o vídeo.");
        }
        setVideoUrl(confirmado?.videoUrl ?? null);
      } else {
        // 2) Dev sem Supabase: multipart via servidor (public/uploads)
        const formData = new FormData();
        formData.append("video", arquivo);
        const res = await fetch(`/api/admin/properties/${propertyId}/video`, {
          method: "POST",
          body: formData,
        });
        const body = (await res.json().catch(() => null)) as {
          erro?: string;
          videoUrl?: string;
        } | null;
        if (!res.ok) throw new Error(body?.erro ?? "Erro ao enviar o vídeo.");
        setVideoUrl(body?.videoUrl ?? null);
      }
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar o vídeo.");
    } finally {
      setEnviando(false);
    }
  }

  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);

  async function remover() {
    setConfirmandoRemocao(false);
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/video`, {
        method: "DELETE",
      });
      const body = (await res.json().catch(() => null)) as {
        erro?: string;
      } | null;
      if (!res.ok) throw new Error(body?.erro ?? "Erro ao remover o vídeo.");
      setVideoUrl(null);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao remover o vídeo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section aria-labelledby="video-titulo" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="video-titulo" className="text-xl tracking-tight">
          Vídeo do imóvel
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
            className="inline-flex items-center gap-2 rounded-pill border border-black/15 px-5 py-2.5 text-[13px] font-medium transition-colors hover:border-black disabled:opacity-60"
          >
            {enviando ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Video size={14} aria-hidden="true" />
            )}
            {enviando
              ? "Enviando vídeo…"
              : videoUrl
                ? "Trocar vídeo"
                : "Adicionar vídeo"}
          </button>
          {videoUrl && (
            <button
              type="button"
              onClick={() => setConfirmandoRemocao(true)}
              disabled={enviando}
              aria-label="Remover vídeo"
              className="rounded-full p-2.5 text-black/60 transition-colors hover:bg-mist hover:text-black disabled:opacity-60"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          hidden
          onChange={onSelecionar}
          aria-label="Selecionar vídeo para enviar"
        />
      </div>

      <p className="text-[12px] text-black/45">
        MP4, WebM ou MOV até 50 MB. O vídeo aparece na página do imóvel,
        abaixo das fotos — a capa do anúncio continua sendo uma foto.
      </p>

      {erro && (
        <p
          role="alert"
          className="rounded-xl bg-black px-4 py-3 text-[13px] text-white"
        >
          {erro}
        </p>
      )}

      {videoUrl ? (
        <video
          key={videoUrl}
          src={videoUrl}
          controls
          preload="metadata"
          className="aspect-video w-full rounded-2xl bg-black"
        />
      ) : (
        <div className="rounded-2xl bg-mist px-6 py-12 text-center text-sm text-black/50">
          Nenhum vídeo ainda. Um tour em vídeo aumenta muito o interesse —
          grave na horizontal, com o celular estabilizado.
        </div>
      )}

      <ConfirmDialog
        aberto={confirmandoRemocao}
        titulo="Remover o vídeo deste imóvel?"
        descricao="O arquivo será apagado do storage. Você pode enviar outro depois."
        rotuloConfirmar="Remover vídeo"
        onConfirmar={remover}
        onCancelar={() => setConfirmandoRemocao(false)}
      />
    </section>
  );
}
