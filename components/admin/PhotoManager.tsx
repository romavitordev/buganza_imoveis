"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";
import type { AdminPhoto } from "@/lib/admin-types";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const MAX_TAMANHO_BYTES = 5 * 1024 * 1024;

interface PhotoManagerProps {
  propertyId: string;
  fotosIniciais: AdminPhoto[];
}

export default function PhotoManager({
  propertyId,
  fotosIniciais,
}: PhotoManagerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState(fotosIniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [ocupadaId, setOcupadaId] = useState<string | null>(null);

  const ordenadas = fotos.slice().sort((a, b) => a.ordem - b.ordem);

  /**
   * Envia uma foto. Produção: upload DIRETO navegador → Supabase via URL
   * assinada (o arquivo não passa pela Vercel). Dev sem Supabase: a rota
   * de assinatura responde { fallback: true } e caímos no multipart local.
   */
  async function enviarFoto(arquivo: File): Promise<AdminPhoto[]> {
    const contentType = arquivo.type || "application/octet-stream";

    const sign = await fetch(`/api/admin/properties/${propertyId}/uploads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "foto",
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
      if (!upload.ok) throw new Error("Falha no envio direto da foto.");

      const confirmar = await fetch(
        `/api/admin/properties/${propertyId}/uploads`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "foto",
            storageKeys: [signBody.storageKey],
          }),
        }
      );
      const confirmado = (await confirmar.json().catch(() => null)) as {
        erro?: string;
        fotos?: AdminPhoto[];
      } | null;
      if (!confirmar.ok) {
        throw new Error(confirmado?.erro ?? "Erro ao registrar a foto.");
      }
      return confirmado?.fotos ?? [];
    }

    // Fallback de desenvolvimento: multipart via servidor
    const formData = new FormData();
    formData.append("fotos", arquivo);
    const res = await fetch(`/api/admin/properties/${propertyId}/photos`, {
      method: "POST",
      body: formData,
    });
    const body = (await res.json().catch(() => null)) as {
      erro?: string;
      fotos?: AdminPhoto[];
    } | null;
    if (!res.ok) throw new Error(body?.erro ?? "Erro ao enviar a foto.");
    return body?.fotos ?? [];
  }

  async function onSelecionar(e: ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite reenviar o mesmo arquivo depois
    if (arquivos.length === 0) return;

    setErro(null);

    // Validação local antes do envio
    for (const arquivo of arquivos) {
      if (!arquivo.type.startsWith("image/")) {
        setErro(`"${arquivo.name}" não é uma imagem.`);
        return;
      }
      if (arquivo.size > MAX_TAMANHO_BYTES) {
        setErro(`"${arquivo.name}" excede o limite de 5 MB.`);
        return;
      }
    }

    // Envia um a um para mostrar o progresso real
    for (let i = 0; i < arquivos.length; i++) {
      setProgresso(`Enviando foto ${i + 1} de ${arquivos.length}…`);
      try {
        const novas = await enviarFoto(arquivos[i]);
        if (novas.length > 0) {
          setFotos((atual) => [...atual, ...novas]);
        }
      } catch (err) {
        setErro(
          err instanceof Error
            ? `${err.message} (${arquivos[i].name})`
            : "Erro ao enviar as fotos."
        );
        break;
      }
    }

    setProgresso(null);
    router.refresh();
  }

  async function acao(
    foto: AdminPhoto,
    corpo: { capa: true } | { mover: "cima" | "baixo" }
  ) {
    setOcupadaId(foto.id);
    setErro(null);
    try {
      const res = await fetch(
        `/api/admin/properties/${propertyId}/photos/${foto.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        }
      );
      const body = (await res.json().catch(() => null)) as {
        erro?: string;
        fotos?: AdminPhoto[];
      } | null;
      if (!res.ok) throw new Error(body?.erro ?? "Erro ao atualizar a foto.");
      if (body?.fotos) setFotos(body.fotos);
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : "Erro ao atualizar a foto."
      );
    } finally {
      setOcupadaId(null);
    }
  }

  // Foto aguardando confirmação de exclusão no modal
  const [paraExcluir, setParaExcluir] = useState<AdminPhoto | null>(null);

  // Drag-and-drop de reordenação (as setas seguem como fallback de teclado)
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [sobreId, setSobreId] = useState<string | null>(null);

  async function salvarOrdem(novaLista: AdminPhoto[]) {
    // Otimista: aplica localmente e persiste em uma chamada só
    setFotos(novaLista.map((f, i) => ({ ...f, ordem: i })));
    setErro(null);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordem: novaLista.map((f) => f.id) }),
      });
      const body = (await res.json().catch(() => null)) as {
        erro?: string;
        fotos?: AdminPhoto[];
      } | null;
      if (!res.ok) throw new Error(body?.erro ?? "Erro ao salvar a ordem.");
      if (body?.fotos) setFotos(body.fotos);
      router.refresh();
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : "Erro ao salvar a nova ordem."
      );
      router.refresh();
    }
  }

  function soltarSobre(alvo: AdminPhoto) {
    if (!arrastandoId || arrastandoId === alvo.id) return;
    const lista = ordenadas.slice();
    const de = lista.findIndex((f) => f.id === arrastandoId);
    const para = lista.findIndex((f) => f.id === alvo.id);
    if (de < 0 || para < 0) return;
    const [movida] = lista.splice(de, 1);
    lista.splice(para, 0, movida);
    salvarOrdem(lista);
  }

  async function excluir(foto: AdminPhoto) {
    setParaExcluir(null);
    setOcupadaId(foto.id);
    setErro(null);
    try {
      const res = await fetch(
        `/api/admin/properties/${propertyId}/photos/${foto.id}`,
        { method: "DELETE" }
      );
      const body = (await res.json().catch(() => null)) as {
        erro?: string;
        fotos?: AdminPhoto[];
      } | null;
      if (!res.ok) throw new Error(body?.erro ?? "Erro ao excluir a foto.");
      setFotos(body?.fotos ?? fotos.filter((f) => f.id !== foto.id));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao excluir a foto.");
    } finally {
      setOcupadaId(null);
    }
  }

  return (
    <section aria-labelledby="fotos-titulo" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="fotos-titulo" className="text-xl tracking-tight">
          Fotos ({fotos.length})
        </h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={Boolean(progresso)}
          className="inline-flex items-center gap-2 rounded-pill border border-black/15 px-5 py-2.5 text-[13px] font-medium transition-colors hover:border-black disabled:opacity-60"
        >
          {progresso ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus size={14} aria-hidden="true" />
          )}
          {progresso ?? "Adicionar fotos"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={onSelecionar}
          aria-label="Selecionar fotos para enviar"
        />
      </div>

      <p className="text-[12px] text-black/45">
        Formatos de imagem até 5 MB cada. A foto marcada com ★ é a capa do
        anúncio. Arraste as fotos para reordenar.
      </p>

      {erro && (
        <p
          role="alert"
          className="rounded-xl bg-black px-4 py-3 text-[13px] text-white"
        >
          {erro}
        </p>
      )}

      {ordenadas.length === 0 ? (
        <div className="rounded-2xl bg-mist px-6 py-12 text-center text-sm text-black/50">
          Nenhuma foto ainda. Anúncios com fotos convertem muito mais —
          adicione pelo menos 3.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {ordenadas.map((foto, i) => {
            const ocupada = ocupadaId === foto.id;
            const arrastando = arrastandoId === foto.id;
            const alvoDeDrop = sobreId === foto.id && !arrastando;
            return (
              <li
                key={foto.id}
                draggable
                onDragStart={() => setArrastandoId(foto.id)}
                onDragEnd={() => {
                  setArrastandoId(null);
                  setSobreId(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setSobreId(foto.id);
                }}
                onDragLeave={() =>
                  setSobreId((atual) => (atual === foto.id ? null : atual))
                }
                onDrop={(e) => {
                  e.preventDefault();
                  soltarSobre(foto);
                  setSobreId(null);
                }}
                className={`flex cursor-grab flex-col gap-2 active:cursor-grabbing ${
                  ocupada ? "opacity-50" : ""
                } ${arrastando ? "opacity-40" : ""}`}
              >
                <div
                  className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-mist transition-shadow ${
                    alvoDeDrop ? "ring-2 ring-black ring-offset-2" : ""
                  }`}
                >
                  <Image
                    src={foto.url}
                    alt={`Foto ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                  {foto.capa && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-pill bg-black px-2.5 py-1 text-[10px] font-medium text-white">
                      <Star size={10} className="fill-white" aria-hidden="true" />
                      Capa
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={ocupada || i === 0}
                      onClick={() => acao(foto, { mover: "cima" })}
                      aria-label="Mover foto para cima"
                      className="rounded-full p-1.5 transition-colors hover:bg-mist disabled:opacity-30"
                    >
                      <ArrowUp size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={ocupada || i === ordenadas.length - 1}
                      onClick={() => acao(foto, { mover: "baixo" })}
                      aria-label="Mover foto para baixo"
                      className="rounded-full p-1.5 transition-colors hover:bg-mist disabled:opacity-30"
                    >
                      <ArrowDown size={14} aria-hidden="true" />
                    </button>
                    {!foto.capa && (
                      <button
                        type="button"
                        disabled={ocupada}
                        onClick={() => acao(foto, { capa: true })}
                        aria-label="Definir como capa"
                        className="rounded-full p-1.5 transition-colors hover:bg-mist"
                      >
                        <Star size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={ocupada}
                    onClick={() => setParaExcluir(foto)}
                    aria-label="Excluir foto"
                    className="rounded-full p-1.5 text-black/60 transition-colors hover:bg-mist hover:text-black"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        aberto={paraExcluir !== null}
        titulo="Excluir esta foto?"
        descricao="Ela será removida do storage. Se for a capa, a próxima foto assume automaticamente."
        rotuloConfirmar="Excluir foto"
        onConfirmar={() => paraExcluir && excluir(paraExcluir)}
        onCancelar={() => setParaExcluir(null)}
      />
    </section>
  );
}
