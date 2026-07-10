"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import type { AdminProperty } from "@/lib/admin-types";
import {
  STATUS_LABEL,
  SUBTIPO_LABEL,
  SUBTIPOS_POR_TIPO,
  TIPO_LABEL,
  TRANSACAO_LABEL,
} from "@/lib/labels";
import { COMODIDADES } from "@/lib/comodidades";
import { normalizarPreco, previewPreco } from "@/lib/preco";

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

/** Card de seção do formulário. */
function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/10 p-5 md:p-6">
      <h2 className="text-lg tracking-tight">{titulo}</h2>
      {descricao && (
        <p className="mt-1 text-[12px] leading-relaxed text-black/45">
          {descricao}
        </p>
      )}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

/**
 * Campo de preço com preview formatado ao vivo — o corretor VÊ como o
 * valor foi entendido ("= R$ 2.200,50") antes de salvar, eliminando a
 * ambiguidade de formato que já corrompeu preços (bug do ×100).
 */
function CampoPreco({
  rotulo,
  valor,
  onChange,
  placeholder,
  span2,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  span2?: boolean;
}) {
  const vazio = valor.trim() === "";
  const numero = normalizarPreco(valor);
  const invalido = !vazio && (numero === null || Number.isNaN(numero));
  const preview = previewPreco(valor);

  return (
    <label className={`${labelCls} ${span2 ? "md:col-span-2" : ""}`}>
      <span className={legendaCls}>{rotulo}</span>
      <input
        inputMode="decimal"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalido || undefined}
        className={`${inputCls} ${invalido ? "border-black" : ""}`}
        placeholder={placeholder ?? "Ex.: 450.000 (vazio = Sob consulta)"}
      />
      <span
        className={`min-h-[16px] text-[11px] ${
          invalido ? "font-medium text-black" : "text-black/45"
        }`}
        aria-live="polite"
      >
        {invalido
          ? "Valor não reconhecido — use 450.000 ou 450000,00"
          : preview
            ? `= ${preview}`
            : " "}
      </span>
    </label>
  );
}

export default function PropertyForm({ property }: PropertyFormProps) {
  const router = useRouter();
  const editando = Boolean(property);

  const [titulo, setTitulo] = useState(property?.titulo ?? "");
  const [slug, setSlug] = useState(property?.slug ?? "");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(
    Boolean(property)
  );
  const [tipo, setTipo] = useState(property?.tipo ?? "RESIDENCIAL");
  const [subtipo, setSubtipo] = useState<string>(property?.subtipo ?? "");
  const [transacao, setTransacao] = useState(property?.transacao ?? "VENDA");
  const [status, setStatus] = useState(property?.status ?? "ATIVO");
  const [destaque, setDestaque] = useState(property?.destaque ?? false);
  const [cidade, setCidade] = useState(property?.cidade ?? "Sorocaba");
  const [bairro, setBairro] = useState(property?.bairro ?? "");
  const [enderecoMapa, setEnderecoMapa] = useState(
    property?.enderecoMapa ?? ""
  );

  const numeroInicial = (v: number | null | undefined) =>
    v !== null && v !== undefined ? String(v) : "";
  const [quartos, setQuartos] = useState(numeroInicial(property?.quartos));
  const [suites, setSuites] = useState(numeroInicial(property?.suites));
  const [banheiros, setBanheiros] = useState(
    numeroInicial(property?.banheiros)
  );
  const [vagas, setVagas] = useState(numeroInicial(property?.vagas));
  const [areaM2, setAreaM2] = useState(numeroInicial(property?.areaM2));
  const [areaTerrenoM2, setAreaTerrenoM2] = useState(
    numeroInicial(property?.areaTerrenoM2)
  );

  const [precoVenda, setPrecoVenda] = useState(property?.precoVenda ?? "");
  const [precoLocacao, setPrecoLocacao] = useState(
    property?.precoLocacao ?? ""
  );
  const [precoInterno, setPrecoInterno] = useState(
    property?.precoInterno ?? ""
  );
  const [condominioMensal, setCondominioMensal] = useState(
    property?.condominioMensal ?? ""
  );
  const [iptuAnual, setIptuAnual] = useState(property?.iptuAnual ?? "");

  const [comodidades, setComodidades] = useState<string[]>(
    property?.comodidades ?? []
  );
  const [descricao, setDescricao] = useState(property?.descricao ?? "");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const ehTerreno = tipo === "TERRENO";
  const subtiposDoTipo = SUBTIPOS_POR_TIPO[tipo];

  function onTituloChange(valor: string) {
    setTitulo(valor);
    if (!slugEditadoManualmente) setSlug(slugPreview(valor));
  }

  function onTipoChange(novoTipo: AdminProperty["tipo"]) {
    setTipo(novoTipo);
    // Subtipo incoerente com o novo tipo é descartado
    if (subtipo && !SUBTIPOS_POR_TIPO[novoTipo].includes(subtipo as never)) {
      setSubtipo("");
    }
  }

  function toggleComodidade(valor: string) {
    setComodidades((atual) =>
      atual.includes(valor)
        ? atual.filter((c) => c !== valor)
        : [...atual, valor]
    );
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
      subtipo: subtipo || null,
      transacao,
      status,
      destaque,
      cidade,
      bairro,
      enderecoMapa: enderecoMapa || null,
      // Terreno não tem cômodos — campos escondidos vão como null para
      // não deixar dado inconsistente gravado
      quartos: ehTerreno ? null : quartos || null,
      suites: ehTerreno ? null : suites || null,
      banheiros: ehTerreno ? null : banheiros || null,
      vagas: ehTerreno ? null : vagas || null,
      areaM2: ehTerreno ? null : areaM2 || null,
      areaTerrenoM2: areaTerrenoM2 || null,
      precoVenda: precoVenda || null,
      precoLocacao: precoLocacao || null,
      precoInterno: precoInterno || null,
      condominioMensal: condominioMensal || null,
      iptuAnual: iptuAnual || null,
      comodidades,
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

      <Secao
        titulo="Identificação"
        descricao="Como o anúncio aparece nos cards e nos resultados do Google."
      >
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

        <label className={labelCls}>
          <span className={legendaCls}>Tipo *</span>
          <select
            value={tipo}
            onChange={(e) =>
              onTipoChange(e.target.value as AdminProperty["tipo"])
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
          <span className={legendaCls}>Subtipo</span>
          <select
            value={subtipo}
            onChange={(e) => setSubtipo(e.target.value)}
            className={inputCls}
          >
            <option value="">Não especificar</option>
            {subtiposDoTipo.map((valor) => (
              <option key={valor} value={valor}>
                {SUBTIPO_LABEL[valor]}
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
          <span className={legendaCls}>
            Slug (endereço da página — automático)
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
      </Secao>

      <Secao
        titulo="Localização"
        descricao="O endereço completo é opcional e serve só para posicionar o pino do mapa — o site nunca exibe o número."
      >
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
          <span className={legendaCls}>Endereço para o mapa (opcional)</span>
          <input
            value={enderecoMapa}
            onChange={(e) => setEnderecoMapa(e.target.value)}
            maxLength={160}
            className={inputCls}
            placeholder="Ex.: Rua das Palmeiras, 123 — vazio = mapa mostra só o bairro"
          />
        </label>
      </Secao>

      <Secao
        titulo="Características"
        descricao={
          ehTerreno
            ? "Terreno usa só a área — cômodos não se aplicam."
            : "Campos vazios simplesmente não aparecem no anúncio."
        }
      >
        {!ehTerreno && (
          <>
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
              <span className={legendaCls}>
                Suítes (contam dentro dos quartos)
              </span>
              <input
                type="number"
                min={0}
                max={quartos ? Number(quartos) : undefined}
                value={suites}
                onChange={(e) => setSuites(e.target.value)}
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
              <span className={legendaCls}>Área útil / construída (m²)</span>
              <input
                type="number"
                min={0}
                value={areaM2}
                onChange={(e) => setAreaM2(e.target.value)}
                className={inputCls}
              />
            </label>
          </>
        )}

        <label className={labelCls}>
          <span className={legendaCls}>Área do terreno (m²)</span>
          <input
            type="number"
            min={0}
            value={areaTerrenoM2}
            onChange={(e) => setAreaTerrenoM2(e.target.value)}
            className={inputCls}
          />
        </label>

        {!ehTerreno && (
          <fieldset className="md:col-span-2">
            <legend className={legendaCls}>Comodidades</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMODIDADES.map(({ valor, rotulo }) => {
                const ativa = comodidades.includes(valor);
                return (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => toggleComodidade(valor)}
                    aria-pressed={ativa}
                    className={`rounded-pill border px-3.5 py-2 text-[12px] font-medium transition-colors ${
                      ativa
                        ? "border-black bg-black text-white"
                        : "border-black/12 bg-white text-black/70 hover:border-black/40"
                    }`}
                  >
                    {rotulo}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      </Secao>

      <Secao
        titulo="Valores"
        descricao="Preços públicos vazios aparecem como “Sob consulta”. Confira o valor interpretado abaixo de cada campo antes de salvar."
      >
        <CampoPreco
          rotulo="Preço de venda (R$) — exibido no site"
          valor={precoVenda}
          onChange={setPrecoVenda}
        />
        <CampoPreco
          rotulo="Preço de locação (R$/mês) — exibido no site"
          valor={precoLocacao}
          onChange={setPrecoLocacao}
          placeholder="Ex.: 2.500 (vazio = Sob consulta)"
        />
        <CampoPreco
          rotulo="Condomínio (R$/mês)"
          valor={condominioMensal}
          onChange={setCondominioMensal}
          placeholder="Ex.: 650 (vazio = não exibe)"
        />
        <CampoPreco
          rotulo="IPTU (R$/ano)"
          valor={iptuAnual}
          onChange={setIptuAnual}
          placeholder="Ex.: 1.800 (vazio = não exibe)"
        />
        <CampoPreco
          rotulo="Preço interno — NUNCA aparece no site"
          valor={precoInterno}
          onChange={setPrecoInterno}
          placeholder="Uso dos corretores (negociação, margem…)"
          span2
        />
      </Secao>

      <Secao titulo="Descrição">
        <label className={`${labelCls} md:col-span-2`}>
          <span className={legendaCls}>Descrição do anúncio *</span>
          <textarea
            required
            minLength={10}
            rows={7}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={`${inputCls} resize-y leading-relaxed`}
            placeholder="Descreva o imóvel com detalhes: cômodos, acabamentos, localização, diferenciais…"
          />
          <span
            className={`text-[11px] ${
              descricao.length >= 300 ? "text-black/45" : "text-black/60"
            }`}
          >
            {descricao.length} caracteres
            {descricao.length < 300 &&
              " — descrições com 300+ convertem melhor"}
          </span>
        </label>
      </Secao>

      <Secao
        titulo="Publicação"
        descricao="Só imóveis Ativos aparecem no site. Pausado some na hora."
      >
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
      </Secao>

      {erro && (
        <p
          role="alert"
          className="rounded-xl bg-black px-4 py-3 text-[13px] text-white"
        >
          {erro}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:border md:px-5">
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
              : "Criar e adicionar fotos"}
        </button>
        {salvo && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-black/60">
            <Check size={15} aria-hidden="true" />
            Alterações salvas
          </span>
        )}
        {!editando && (
          <span className="text-[12px] text-black/45">
            As fotos entram no próximo passo.
          </span>
        )}
      </div>
    </form>
  );
}
