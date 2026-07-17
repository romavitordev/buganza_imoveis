"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Search, SlidersHorizontal, X } from "lucide-react";
import { TIPO_LABEL, TRANSACAO_LABEL } from "@/lib/labels";
import { previewPreco } from "@/lib/preco";

/** Estado dos filtros vindo da URL (validado no servidor). */
export interface FiltrosCatalogo {
  q?: string;
  tipo?: string;
  transacao?: string;
  cidade?: string;
  bairro?: string;
  quartos?: number;
  precoMin?: number;
  precoMax?: number;
  ordem: string;
}

const ORDENS = [
  { valor: "recentes", label: "Mais recentes" },
  { valor: "preco-asc", label: "Menor preço" },
  { valor: "preco-desc", label: "Maior preço" },
];

function montarUrl(
  filtros: FiltrosCatalogo,
  overrides: Partial<Record<keyof FiltrosCatalogo, string | undefined>>
): string {
  const query = new URLSearchParams();
  const atual: Record<string, string | undefined> = {
    q: filtros.q,
    tipo: filtros.tipo,
    transacao: filtros.transacao,
    cidade: filtros.cidade,
    bairro: filtros.bairro,
    quartos: filtros.quartos ? String(filtros.quartos) : undefined,
    precoMin: filtros.precoMin ? String(filtros.precoMin) : undefined,
    precoMax: filtros.precoMax ? String(filtros.precoMax) : undefined,
    ordem: filtros.ordem !== "recentes" ? filtros.ordem : undefined,
    ...overrides,
  };
  for (const [chave, valor] of Object.entries(atual)) {
    if (valor) query.set(chave, valor);
  }
  const texto = query.toString();
  return texto ? `/imoveis?${texto}` : "/imoveis";
}

const selectCls =
  "w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-black md:w-auto";
const campoCls = "flex flex-col gap-1";
const rotuloCls =
  "text-[11px] font-medium uppercase tracking-wide text-black/40";

/**
 * Barra de filtros do catálogo — tudo via URL (filtros compartilháveis).
 * A filtragem é AUTOMÁTICA: selects navegam na hora; busca e faixa de
 * preço navegam com um pequeno atraso (debounce) enquanto digita. Sem
 * botão "Filtrar". Desktop: linha compacta; mobile: botão "Filtros" abre
 * o painel. Chips removem filtros ativos.
 */
export default function CatalogoFiltros({
  filtros,
  cidades,
  bairros,
  total,
}: {
  filtros: FiltrosCatalogo;
  cidades: string[];
  bairros: string[];
  total: number;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  // Campos de texto: estado local + debounce (navegar a cada tecla seria
  // ruim). Selects não precisam — navegam direto no onChange.
  const [busca, setBusca] = useState(filtros.q ?? "");
  const [precoMin, setPrecoMin] = useState(
    filtros.precoMin ? String(filtros.precoMin) : ""
  );
  const [precoMax, setPrecoMax] = useState(
    filtros.precoMax ? String(filtros.precoMax) : ""
  );

  // Ressincroniza os campos quando os filtros da URL mudam (ex.: clicar
  // num chip para remover, ou "Limpar tudo")
  useEffect(() => {
    setBusca(filtros.q ?? "");
    setPrecoMin(filtros.precoMin ? String(filtros.precoMin) : "");
    setPrecoMax(filtros.precoMax ? String(filtros.precoMax) : "");
  }, [filtros.q, filtros.precoMin, filtros.precoMax]);

  const primeiraRenderRef = useRef(true);
  useEffect(() => {
    // não navega no primeiro render (evita reload logo ao abrir a página)
    if (primeiraRenderRef.current) {
      primeiraRenderRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      const destino = montarUrl(filtros, {
        q: busca.trim() || undefined,
        precoMin: precoMin.trim() || undefined,
        precoMax: precoMax.trim() || undefined,
      });
      // só navega se algo realmente mudou em relação ao que já está na URL
      if (destino !== montarUrl(filtros, {})) router.push(destino);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, precoMin, precoMax]);

  /** Navega imediatamente ao trocar um select. */
  function aoTrocarSelect(campo: keyof FiltrosCatalogo, valor: string) {
    router.push(montarUrl(filtros, { [campo]: valor || undefined }));
  }

  // Chips dos filtros ativos (busca incluída) — cada um com o X que remove
  const chips: { chave: keyof FiltrosCatalogo; rotulo: string }[] = [];
  if (filtros.q) chips.push({ chave: "q", rotulo: `“${filtros.q}”` });
  if (filtros.tipo) {
    chips.push({
      chave: "tipo",
      rotulo: TIPO_LABEL[filtros.tipo as keyof typeof TIPO_LABEL] ?? filtros.tipo,
    });
  }
  if (filtros.transacao) {
    chips.push({
      chave: "transacao",
      rotulo:
        TRANSACAO_LABEL[filtros.transacao as keyof typeof TRANSACAO_LABEL] ??
        filtros.transacao,
    });
  }
  if (filtros.cidade) chips.push({ chave: "cidade", rotulo: filtros.cidade });
  if (filtros.bairro) chips.push({ chave: "bairro", rotulo: filtros.bairro });
  if (filtros.quartos) {
    chips.push({ chave: "quartos", rotulo: `${filtros.quartos}+ quartos` });
  }
  if (filtros.precoMin) {
    chips.push({
      chave: "precoMin",
      rotulo: `de ${previewPreco(String(filtros.precoMin)) ?? filtros.precoMin}`,
    });
  }
  if (filtros.precoMax) {
    chips.push({
      chave: "precoMax",
      rotulo: `até ${previewPreco(String(filtros.precoMax)) ?? filtros.precoMax}`,
    });
  }

  const totalFiltrosAtivos = chips.length;

  return (
    <div className="mb-10 flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {/* Busca + botão de filtros (mobile) */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:max-w-md" role="search">
            <Search
              size={15}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por bairro, título ou código…"
              aria-label="Buscar imóveis por texto"
              className="w-full rounded-pill border border-black/15 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-black"
            />
          </div>
          <button
            type="button"
            onClick={() => setAberto((a) => !a)}
            aria-expanded={aberto}
            aria-controls="painel-filtros"
            className={`inline-flex items-center gap-2 rounded-pill border px-4 py-2.5 text-[13px] font-medium transition-colors md:hidden ${
              totalFiltrosAtivos > 0
                ? "border-black bg-black text-white"
                : "border-black/15 text-black/70"
            }`}
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            Filtros
            {totalFiltrosAtivos > 0 && ` (${totalFiltrosAtivos})`}
          </button>
        </div>

        {/* Painel de filtros: linha no desktop, painel expansível no mobile */}
        <div
          id="painel-filtros"
          className={`${
            aberto ? "grid" : "hidden"
          } grid-cols-2 gap-3 rounded-2xl border border-black/10 bg-white p-4 md:flex md:flex-wrap md:items-end md:rounded-none md:border-0 md:bg-transparent md:p-0`}
        >
          <div className={campoCls}>
            <span className={rotuloCls}>Tipo</span>
            <select
              value={filtros.tipo ?? ""}
              onChange={(e) => aoTrocarSelect("tipo", e.target.value)}
              className={selectCls}
              aria-label="Filtrar por tipo"
            >
              <option value="">Todos</option>
              {Object.entries(TIPO_LABEL).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </div>

          <div className={campoCls}>
            <span className={rotuloCls}>Transação</span>
            <select
              value={filtros.transacao ?? ""}
              onChange={(e) => aoTrocarSelect("transacao", e.target.value)}
              className={selectCls}
              aria-label="Filtrar por transação"
            >
              <option value="">Todas</option>
              <option value="VENDA">Venda</option>
              <option value="LOCACAO">Locação</option>
            </select>
          </div>

          {cidades.length > 1 && (
            <div className={campoCls}>
              <span className={rotuloCls}>Cidade</span>
              <select
                value={filtros.cidade ?? ""}
                onChange={(e) => aoTrocarSelect("cidade", e.target.value)}
                className={selectCls}
                aria-label="Filtrar por cidade"
              >
                <option value="">Todas</option>
                {cidades.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {bairros.length > 1 && (
            <div className={campoCls}>
              <span className={rotuloCls}>Bairro</span>
              <select
                value={filtros.bairro ?? ""}
                onChange={(e) => aoTrocarSelect("bairro", e.target.value)}
                className={selectCls}
                aria-label="Filtrar por bairro"
              >
                <option value="">Todos</option>
                {bairros.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={campoCls}>
            <span className={rotuloCls}>Quartos</span>
            <select
              value={filtros.quartos ? String(filtros.quartos) : ""}
              onChange={(e) => aoTrocarSelect("quartos", e.target.value)}
              className={selectCls}
              aria-label="Mínimo de quartos"
            >
              <option value="">Qualquer</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </div>

          <div className={campoCls}>
            <span className={rotuloCls}>Preço mín. (R$)</span>
            <input
              inputMode="numeric"
              value={precoMin}
              onChange={(e) => setPrecoMin(e.target.value)}
              placeholder="0"
              className={`${selectCls} md:w-28`}
              aria-label="Preço mínimo"
            />
          </div>

          <div className={campoCls}>
            <span className={rotuloCls}>Preço máx. (R$)</span>
            <input
              inputMode="numeric"
              value={precoMax}
              onChange={(e) => setPrecoMax(e.target.value)}
              placeholder="Sem limite"
              className={`${selectCls} md:w-28`}
              aria-label="Preço máximo"
            />
          </div>
        </div>
      </div>

      {/* Chips dos filtros ativos */}
      {chips.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="Filtros ativos"
        >
          {chips.map(({ chave, rotulo }) => (
            <Link
              key={chave}
              href={montarUrl(filtros, { [chave]: undefined })}
              className="inline-flex items-center gap-1.5 rounded-pill bg-black px-3.5 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-80"
            >
              {rotulo}
              <X size={12} aria-hidden="true" />
              <span className="sr-only">— remover filtro</span>
            </Link>
          ))}
          <Link
            href="/imoveis"
            className="text-[12px] font-medium text-black/50 underline-offset-2 hover:underline"
          >
            Limpar tudo
          </Link>
        </div>
      )}

      {/* Contagem + ordenação */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-black/45">
          {total} imóve{total === 1 ? "l" : "is"} encontrado
          {total === 1 ? "" : "s"}
        </p>
        <label className="flex items-center gap-2 text-[12px] text-black/50">
          <ArrowUpDown size={13} aria-hidden="true" />
          Ordenar
          <select
            value={filtros.ordem}
            onChange={(e) =>
              router.push(montarUrl(filtros, { ordem: e.target.value }))
            }
            className="rounded-pill border border-black/15 bg-white px-3 py-1.5 text-[12px] font-medium text-black outline-none transition-colors focus:border-black"
            aria-label="Ordenar resultados"
          >
            {ORDENS.map(({ valor, label }) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
