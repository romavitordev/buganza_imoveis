"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, Loader2, Rocket } from "lucide-react";
import type { AdminProperty } from "@/lib/admin-types";

/**
 * Assistente de publicação: mostra as etapas quando o anúncio ainda está
 * pausado (dados → fotos → publicar) e um checklist de qualidade que
 * empurra o corretor para anúncios que convertem melhor.
 */
export default function QualidadeAnuncio({
  property,
}: {
  property: AdminProperty;
}) {
  const router = useRouter();
  const [publicando, setPublicando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const ehTerreno = property.tipo === "TERRENO";
  const rascunho = property.status === "PAUSADO";
  const totalFotos = property.fotos.length;

  const itens = [
    { rotulo: "Pelo menos 3 fotos", ok: totalFotos >= 3 },
    {
      rotulo: "Descrição com 300+ caracteres",
      ok: property.descricao.length >= 300,
    },
    {
      rotulo: "Preço público preenchido (ou deixe “Sob consulta” de propósito)",
      ok: Boolean(property.precoVenda || property.precoLocacao),
    },
    { rotulo: "Subtipo definido (Casa, Apartamento…)", ok: Boolean(property.subtipo) },
    ...(!ehTerreno
      ? [
          {
            rotulo: "3+ comodidades marcadas",
            ok: property.comodidades.length >= 3,
          },
        ]
      : []),
    {
      rotulo: "Vídeo do imóvel (opcional — aumenta o interesse)",
      ok: Boolean(property.videoUrl),
    },
  ];
  const feitos = itens.filter((i) => i.ok).length;
  const pct = Math.round((feitos / itens.length) * 100);

  async function publicar() {
    setPublicando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ATIVO" }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          erro?: string;
        } | null;
        throw new Error(body?.erro ?? "Erro ao publicar.");
      }
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao publicar.");
    } finally {
      setPublicando(false);
    }
  }

  return (
    <section
      aria-labelledby="qualidade-titulo"
      className="rounded-2xl border border-black/10 p-5 md:p-6"
    >
      {rascunho && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-mist px-4 py-3">
          <ol className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-medium">
            <li className="flex items-center gap-1.5 text-black">
              <Check size={13} aria-hidden="true" />
              1. Dados
            </li>
            <li
              className={`flex items-center gap-1.5 ${
                totalFotos > 0 ? "text-black" : "text-black/45"
              }`}
            >
              {totalFotos > 0 ? (
                <Check size={13} aria-hidden="true" />
              ) : (
                <Circle size={11} aria-hidden="true" />
              )}
              2. Fotos ({totalFotos})
            </li>
            <li className="flex items-center gap-1.5 text-black/45">
              <Circle size={11} aria-hidden="true" />
              3. Publicar
            </li>
          </ol>
          <button
            type="button"
            onClick={publicar}
            disabled={publicando || totalFotos === 0}
            title={
              totalFotos === 0
                ? "Adicione pelo menos 1 foto antes de publicar"
                : undefined
            }
            className="inline-flex items-center gap-2 rounded-pill bg-black px-5 py-2.5 text-[13px] font-medium text-white transition-opacity disabled:opacity-50"
          >
            {publicando ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Rocket size={14} aria-hidden="true" />
            )}
            {publicando ? "Publicando…" : "Publicar imóvel"}
          </button>
        </div>
      )}

      {erro && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-black px-4 py-3 text-[13px] text-white"
        >
          {erro}
        </p>
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="qualidade-titulo" className="text-lg tracking-tight">
          Qualidade do anúncio
        </h2>
        <span className="text-[13px] font-semibold tabular-nums">{pct}%</span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mb-4 h-1.5 overflow-hidden rounded-full bg-mist"
      >
        <div
          className="h-full rounded-full bg-black transition-[width] duration-500 ease-premium"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
        {itens.map(({ rotulo, ok }) => (
          <li
            key={rotulo}
            className={`flex items-start gap-2 text-[13px] ${
              ok ? "text-black/45" : "text-black/75"
            }`}
          >
            {ok ? (
              <Check
                size={14}
                className="mt-0.5 shrink-0 text-black"
                aria-hidden="true"
              />
            ) : (
              <Circle
                size={11}
                className="mt-1 shrink-0 text-black/30"
                aria-hidden="true"
              />
            )}
            <span className={ok ? "line-through decoration-black/20" : ""}>
              {rotulo}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
