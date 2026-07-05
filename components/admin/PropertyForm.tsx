"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import type { AdminProperty } from "@/lib/admin-types";
import { STATUS_LABEL, TIPO_LABEL, TRANSACAO_LABEL } from "@/lib/labels";

interface PropertyFormProps {
  /** Ausente = criação de um novo imóvel. */
  property?: AdminProperty;
}

/** Mesma lógica de lib/slug.ts, replicada no cliente para pré-visualização. */
function slugPreview(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || ""
  );
}

const inputCls =
  "rounded-xl border border-black/15 px-4 py-2.5 text-sm outline-none transition-colors focus:border-black disabled:bg-mist";
const labelCls = "flex flex-col gap-1.5";
const legendaCls = "text-[12px] font-medium text-black/70";

export default function PropertyForm({ property }: PropertyFormProps) {
  const router = useRouter();
  const editando = Boolean(property);

  const [titulo, setTitulo] = useState(property?.titulo ?? "");
  const [slug, setSlug] = useState(property?.slug ?? "");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(
    Boolean(property)
  );
  const [tipo, setTipo] = useState(property?.tipo ?? "RESIDENCIAL");
  const [transacao, setTransacao] = useState(property?.transacao ?? "VENDA");
  const [status, setStatus] = useState(property?.status ?? "ATIVO");
  const [destaque, setDestaque] = useState(property?.destaque ?? false);
  const [cidade, setCidade] = useState(property?.cidade ?? "Sorocaba");
  const [bairro, setBairro] = useState(property?.bairro ?? "");
  const [enderecoMapa, setEnderecoMapa] = useState(
    property?.enderecoMapa ?? ""
  );
  const [quartos, setQuartos] = useState(
    property?.quartos !== null && property?.quartos !== undefined
      ? String(property.quartos)
      : ""
  );
  const [banheiros, setBanheiros] = useState(
    property?.banheiros !== null && property?.banheiros !== undefined
      ? String(property.banheiros)
      : ""
  );
  const [vagas, setVagas] = useState(
    property?.vagas !== null && property?.vagas !== undefined
      ? String(property.vagas)
      : ""
  );
  const [areaM2, setAreaM2] = useState(
    property?.areaM2 !== null && property?.areaM2 !== undefined
      ? String(property.areaM2)
      : ""
  );
  const [precoVenda, setPrecoVenda] = useState(property?.precoVenda ?? "");
  const [precoLocacao, setPrecoLocacao] = useState(
    property?.precoLocacao ?? ""
  );
  const [precoInterno, setPrecoInterno] = useState(
    property?.precoInterno ?? ""
  );
  const [descricao, setDescricao] = useState(property?.descricao ?? "");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  function onTituloChange(valor: string) {
    setTitulo(valor);
    if (!slugEditadoManualmente) setSlug(slugPreview(valor));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvo(false);
    setSalvando(true);

    const payload = {
      titulo,
      slug: slug || undefined,
      tipo,
      transacao,
      status,
      destaque,
      cidade,
      bairro,
      enderecoMapa: enderecoMapa || null,
      quartos: quartos || null,
      banheiros: banheiros || null,
      vagas: vagas || null,
      areaM2: areaM2 || null,
      precoVenda: precoVenda || null,
      precoLocacao: precoLocacao || null,
      precoInterno: precoInterno || null,
      descricao,
    };

    try {
      const res = await fetch(
        editando
          ? `/api/admin/properties/${property?.id}`
          : "/api/admin/properties",
        {
          method: editando ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const body = (await res.json().catch(() => null)) as {
        erro?: string;
        property?: { id: string; slug: string };
      } | null;

      if (!res.ok) {
        throw new Error(body?.erro ?? "Erro ao salvar. Tente novamente.");
      }

      if (!editando && body?.property?.id) {
        // Recém-criado → vai para a edição para subir as fotos
        router.push(`/admin/imoveis/${body.property.id}`);
        router.refresh();
        return;
      }

      if (body?.property?.slug) setSlug(body.property.slug);
      setSalvo(true);
      router.refresh();
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : "Erro ao salvar. Tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-black/55 transition-colors hover:text-black"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Voltar ao painel
        </Link>
        {editando && property && (
          <span className="rounded-pill bg-mist px-3 py-1 text-[11px] font-medium text-black/60">
            {property.codigo}
          </span>
        )}
      </div>

      <h1 className="text-3xl tracking-tight">
        {editando ? "Editar imóvel" : "Novo imóvel"}
      </h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className={`${labelCls} md:col-span-2`}>
          <span className={legendaCls}>Título *</span>
          <input
            required
            minLength={5}
            value={titulo}
            onChange={(e) => onTituloChange(e.target.value)}
            className={inputCls}
            placeholder="Ex.: Casa térrea de 3 quartos no Jardim Europa"
          />
        </label>

        <label className={`${labelCls} md:col-span-2`}>
          <span className={legendaCls}>
            Slug (endereço da página — gerado automaticamente, editável)
          </span>
          <input
            value={slug}
            onChange={(e) => {
              setSlug(slugPreview(e.target.value));
              setSlugEditadoManualmente(true);
            }}
            className={inputCls}
            placeholder="casa-terrea-3-quartos-jardim-europa"
          />
          <span className="text-[11px] text-black/40">
            buganza.com.br/imoveis/{slug || "…"}
          </span>
        </label>

        <label className={labelCls}>
          <span className={legendaCls}>Tipo *</span>
          <select
            value={tipo}
            onChange={(e) =>
              setTipo(e.target.value as AdminProperty["tipo"])
            }
            className={inputCls}
          >
            {Object.entries(TIPO_LABEL).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className={labelCls}>
          <span className={legendaCls}>Transação *</span>
          <select
            value={transacao}
            onChange={(e) =>
              setTransacao(e.target.value as AdminProperty["transacao"])
            }
            className={inputCls}
          >
            {Object.entries(TRANSACAO_LABEL).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className={labelCls}>
          <span className={legendaCls}>Status *</span>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as AdminProperty["status"])
            }
            className={inputCls}
          >
            {Object.entries(STATUS_LABEL).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            checked={destaque}
            onChange={(e) => setDestaque(e.target.checked)}
            className="h-4 w-4 accent-black"
          />
          <span className="text-sm">Exibir na seção “Em destaque”</span>
        </label>

        <label className={labelCls}>
          <span className={legendaCls}>Cidade *</span>
          <input
            required
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          <span className={legendaCls}>Bairro *</span>
          <input
            required
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className={`${labelCls} md:col-span-2`}>
          <span className={legendaCls}>
            Endereço para o mapa (opcional — deixe vazio para mostrar só o
            bairro)
          </span>
          <input
            value={enderecoMapa}
            onChange={(e) => setEnderecoMapa(e.target.value)}
            maxLength={160}
            className={inputCls}
            placeholder="Ex.: Rua das Palmeiras, 123 — usado só para posicionar o pino no site"
          />
        </label>

        <label className={labelCls}>
          <span className={legendaCls}>Quartos</span>
          <input
            type="number"
            min={0}
            value={quartos}
            onChange={(e) => setQuartos(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          <span className={legendaCls}>Banheiros</span>
          <input
            type="number"
            min={0}
            value={banheiros}
            onChange={(e) => setBanheiros(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          <span className={legendaCls}>Vagas de garagem</span>
          <input
            type="number"
            min={0}
            value={vagas}
            onChange={(e) => setVagas(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          <span className={legendaCls}>Área (m²)</span>
          <input
            type="number"
            min={0}
            value={areaM2}
            onChange={(e) => setAreaM2(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className={labelCls}>
          <span className={legendaCls}>
            Preço de venda (R$) — exibido no site
          </span>
          <input
            inputMode="decimal"
            value={precoVenda}
            onChange={(e) => setPrecoVenda(e.target.value)}
            className={inputCls}
            placeholder="Ex.: 450000 (vazio = Sob consulta)"
          />
        </label>

        <label className={labelCls}>
          <span className={legendaCls}>
            Preço de locação (R$/mês) — exibido no site
          </span>
          <input
            inputMode="decimal"
            value={precoLocacao}
            onChange={(e) => setPrecoLocacao(e.target.value)}
            className={inputCls}
            placeholder="Ex.: 2500 (vazio = Sob consulta)"
          />
        </label>

        <label className={`${labelCls} md:col-span-2`}>
          <span className={legendaCls}>
            Preço — uso interno, nunca exibido no site
          </span>
          <input
            inputMode="decimal"
            value={precoInterno}
            onChange={(e) => setPrecoInterno(e.target.value)}
            className={inputCls}
            placeholder="Ex.: 450000,00"
          />
        </label>

        <label className={`${labelCls} md:col-span-2`}>
          <span className={legendaCls}>Descrição *</span>
          <textarea
            required
            minLength={10}
            rows={7}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={`${inputCls} resize-y leading-relaxed`}
            placeholder="Descreva o imóvel com detalhes: cômodos, acabamentos, localização, diferenciais…"
          />
        </label>
      </div>

      {erro && (
        <p
          role="alert"
          className="rounded-xl bg-black px-4 py-3 text-[13px] text-white"
        >
          {erro}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="inline-flex items-center gap-2 rounded-pill bg-black px-7 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-60"
        >
          {salvando && (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          )}
          {salvando
            ? "Salvando…"
            : editando
              ? "Salvar alterações"
              : "Criar imóvel"}
        </button>
        {salvo && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-black/60">
            <Check size={15} aria-hidden="true" />
            Alterações salvas
          </span>
        )}
        {!editando && (
          <span className="text-[12px] text-black/45">
            As fotos são adicionadas no próximo passo, após criar.
          </span>
        )}
      </div>
    </form>
  );
}
