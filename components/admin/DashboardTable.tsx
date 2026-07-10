"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Eye,
  ImageOff,
  LogOut,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import type { AdminProperty } from "@/lib/admin-types";
import { STATUS_LABEL, TIPO_LABEL, TRANSACAO_LABEL } from "@/lib/labels";

const STATUS_ESTILO: Record<AdminProperty["status"], string> = {
  ATIVO: "bg-black text-white",
  PAUSADO: "bg-mist text-black/60",
  VENDIDO: "border border-black/20 text-black/60",
  ALUGADO: "border border-black/20 text-black/60",
};

const POR_PAGINA = 10;

type CampoOrdenavel =
  | "codigo"
  | "titulo"
  | "visualizacoes"
  | "cliquesWhatsApp"
  | "atualizadoEm";

interface Ordenacao {
  campo: CampoOrdenavel;
  asc: boolean;
}

function compararPor(
  a: AdminProperty,
  b: AdminProperty,
  campo: CampoOrdenavel
): number {
  switch (campo) {
    case "codigo":
    case "titulo":
    case "atualizadoEm": // ISO string — ordem lexicográfica = cronológica
      return a[campo].localeCompare(b[campo], "pt-BR");
    case "visualizacoes":
    case "cliquesWhatsApp":
      return a[campo] - b[campo];
  }
}

// Componente de MÓDULO (não aninhado no DashboardTable): declarar dentro
// recriaria o tipo a cada render e o React remontaria o <th>, derrubando
// o foco do teclado a cada clique de ordenação
function ThOrdenavel({
  campo,
  ordenacao,
  onOrdenar,
  alinhar,
  children,
}: {
  campo: CampoOrdenavel;
  ordenacao: Ordenacao;
  onOrdenar: (campo: CampoOrdenavel) => void;
  alinhar?: "right";
  children: React.ReactNode;
}) {
  const ativo = ordenacao.campo === campo;
  const Icone = ativo
    ? ordenacao.asc
      ? ChevronUp
      : ChevronDown
    : ChevronsUpDown;
  return (
    <th
      className={`px-4 py-3 font-medium ${alinhar === "right" ? "text-right" : ""}`}
      aria-sort={ativo ? (ordenacao.asc ? "ascending" : "descending") : undefined}
    >
      <button
        type="button"
        onClick={() => onOrdenar(campo)}
        className={`inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-black ${
          ativo ? "text-black" : ""
        }`}
      >
        {children}
        <Icone size={12} aria-hidden="true" className={ativo ? "" : "opacity-50"} />
      </button>
    </th>
  );
}

interface Resumo7d {
  visualizacoes: number;
  cliquesWhatsApp: number;
  /** % dos acessos vindos de celular (null = sem dados). */
  percentualMobile: number | null;
  /** Principais origens de tráfego (utm_source/referrer). */
  origens: { origem: string; total: number }[];
}

export default function DashboardTable({
  propertiesIniciais,
  resumo7d,
}: {
  propertiesIniciais: AdminProperty[];
  resumo7d: Resumo7d;
}) {
  const router = useRouter();
  const [properties, setProperties] = useState(propertiesIniciais);
  const [busca, setBusca] = useState("");
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<Ordenacao>({
    campo: "atualizadoEm",
    asc: false,
  });
  const [pagina, setPagina] = useState(1);

  function ordenarPor(campo: CampoOrdenavel) {
    setOrdenacao((atual) =>
      atual.campo === campo
        ? { campo, asc: !atual.asc }
        : // Métricas abrem do maior para o menor; texto, em ordem alfabética
          { campo, asc: campo === "codigo" || campo === "titulo" }
    );
    setPagina(1);
  }

  const maisVisto = useMemo(() => {
    const ordenadas = properties
      .slice()
      .sort((a, b) => b.visualizacoes - a.visualizacoes);
    return ordenadas[0]?.visualizacoes ? ordenadas[0] : null;
  }, [properties]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const base = termo
      ? properties.filter(
          (p) =>
            p.titulo.toLowerCase().includes(termo) ||
            p.codigo.toLowerCase().includes(termo)
        )
      : properties;
    const sinal = ordenacao.asc ? 1 : -1;
    return base
      .slice()
      .sort((a, b) => sinal * compararPor(a, b, ordenacao.campo));
  }, [properties, busca, ordenacao]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  // Exclusões/busca podem deixar a página atual além do fim — recua no render
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtradas.slice(
    (paginaAtual - 1) * POR_PAGINA,
    paginaAtual * POR_PAGINA
  );

  async function toggleDestaque(property: AdminProperty) {
    setOcupadoId(property.id);
    setErro(null);
    try {
      const res = await fetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destaque: !property.destaque }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          erro?: string;
        } | null;
        throw new Error(body?.erro ?? "Erro ao atualizar destaque.");
      }
      setProperties((atual) =>
        atual.map((p) =>
          p.id === property.id ? { ...p, destaque: !p.destaque } : p
        )
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao atualizar destaque.");
    } finally {
      setOcupadoId(null);
    }
  }

  async function excluir(property: AdminProperty) {
    const confirmado = window.confirm(
      `Excluir "${property.titulo}" (${property.codigo})?\n\nAs fotos também serão apagadas do storage. Essa ação não pode ser desfeita.`
    );
    if (!confirmado) return;

    setOcupadoId(property.id);
    setErro(null);
    try {
      const res = await fetch(`/api/admin/properties/${property.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          erro?: string;
        } | null;
        throw new Error(body?.erro ?? "Erro ao excluir o imóvel.");
      }
      setProperties((atual) => atual.filter((p) => p.id !== property.id));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir o imóvel.");
    } finally {
      setOcupadoId(null);
    }
  }

  async function sair() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function dataCurta(iso: string): string {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl tracking-tight">Painel de imóveis</h1>
          <p className="mt-1 text-[13px] text-black/50">
            {properties.length} imóve{properties.length === 1 ? "l" : "is"}{" "}
            cadastrado{properties.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/imoveis/novo"
            className="inline-flex items-center gap-2 rounded-pill bg-black px-5 py-2.5 text-[13px] font-medium text-white"
          >
            <Plus size={14} aria-hidden="true" />
            Novo imóvel
          </Link>
          <button
            type="button"
            onClick={sair}
            className="inline-flex items-center gap-2 rounded-pill border border-black/15 px-5 py-2.5 text-[13px] font-medium text-black/70 transition-colors hover:border-black"
          >
            <LogOut size={14} aria-hidden="true" />
            Sair
          </button>
        </div>
      </header>

      {/* Métricas do site público — últimos 7 dias.
          Contagem única por dispositivo/dia; nenhum dado pessoal armazenado. */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-black/10 p-5">
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-black/45">
            <Eye size={13} aria-hidden="true" />
            Visualizações (7 dias)
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">
            {resumo7d.visualizacoes}
          </p>
          {resumo7d.percentualMobile !== null && (
            <p className="mt-0.5 text-[11px] text-black/45">
              {resumo7d.percentualMobile}% pelo celular
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-black/10 p-5">
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-black/45">
            <MessageCircle size={13} aria-hidden="true" />
            Cliques no WhatsApp (7 dias)
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">
            {resumo7d.cliquesWhatsApp}
          </p>
          {resumo7d.visualizacoes > 0 && (
            <p className="mt-0.5 text-[11px] text-black/45">
              {Math.round(
                (resumo7d.cliquesWhatsApp / resumo7d.visualizacoes) * 100
              )}
              % de conversão
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-black/10 p-5">
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-black/45">
            <Star size={13} aria-hidden="true" />
            Mais visto (total)
          </p>
          <p className="mt-1 truncate text-sm font-medium">
            {maisVisto
              ? `${maisVisto.codigo} · ${maisVisto.visualizacoes} visualizaç${
                  maisVisto.visualizacoes === 1 ? "ão" : "ões"
                }`
              : "Sem dados ainda"}
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 p-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-black/45">
            Origens do tráfego (7 dias)
          </p>
          {resumo7d.origens.length > 0 ? (
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {resumo7d.origens.map(({ origem, total }) => (
                <li
                  key={origem}
                  className="flex items-center justify-between gap-2 text-[12px]"
                >
                  <span className="truncate font-medium">{origem}</span>
                  <span className="tabular-nums text-black/50">{total}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm font-medium text-black/50">
              Acessos diretos por enquanto
            </p>
          )}
        </div>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
          aria-hidden="true"
        />
        <input
          type="search"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(1);
          }}
          placeholder="Buscar por título ou código…"
          aria-label="Buscar imóveis"
          className="w-full rounded-pill border border-black/15 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-black"
        />
      </div>

      {erro && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-black px-4 py-3 text-[13px] text-white"
        >
          {erro}
        </p>
      )}

      {filtradas.length === 0 ? (
        <div className="rounded-2xl bg-mist px-6 py-16 text-center">
          <p className="text-sm text-black/55">
            {properties.length === 0
              ? "Nenhum imóvel cadastrado ainda. Clique em “Novo imóvel” para começar."
              : "Nenhum imóvel corresponde à busca."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/10">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-black/10 bg-mist/60 text-[11px] uppercase tracking-wide text-black/45">
                <th className="px-4 py-3 font-medium">Foto</th>
                <ThOrdenavel campo="codigo" ordenacao={ordenacao} onOrdenar={ordenarPor}>
                  Código
                </ThOrdenavel>
                <ThOrdenavel campo="titulo" ordenacao={ordenacao} onOrdenar={ordenarPor}>
                  Título
                </ThOrdenavel>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Transação</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Destaque</th>
                <ThOrdenavel
                  campo="visualizacoes"
                  ordenacao={ordenacao}
                  onOrdenar={ordenarPor}
                  alinhar="right"
                >
                  Views
                </ThOrdenavel>
                <ThOrdenavel
                  campo="cliquesWhatsApp"
                  ordenacao={ordenacao}
                  onOrdenar={ordenarPor}
                  alinhar="right"
                >
                  Cliques WA
                </ThOrdenavel>
                <ThOrdenavel campo="atualizadoEm" ordenacao={ordenacao} onOrdenar={ordenarPor}>
                  Atualizado
                </ThOrdenavel>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/8">
              {visiveis.map((p) => {
                const capa = p.fotos.find((f) => f.capa) ?? p.fotos[0];
                const ocupado = ocupadoId === p.id;
                return (
                  <tr
                    key={p.id}
                    className={ocupado ? "opacity-50" : undefined}
                  >
                    <td className="px-4 py-3">
                      <span className="relative block h-12 w-16 overflow-hidden rounded-lg bg-mist">
                        {capa ? (
                          <Image
                            src={capa.url}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-black/25">
                            <ImageOff size={16} aria-hidden="true" />
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{p.codigo}</td>
                    <td className="max-w-[240px] px-4 py-3">
                      <span className="line-clamp-2">{p.titulo}</span>
                      <span className="mt-0.5 block text-[11px] text-black/45">
                        {p.bairro} · {p.cidade}
                      </span>
                    </td>
                    <td className="px-4 py-3">{TIPO_LABEL[p.tipo]}</td>
                    <td className="px-4 py-3">
                      {TRANSACAO_LABEL[p.transacao]}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-pill px-3 py-1 text-[11px] font-medium ${STATUS_ESTILO[p.status]}`}
                      >
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        disabled={ocupado}
                        onClick={() => toggleDestaque(p)}
                        aria-label={
                          p.destaque
                            ? `Remover destaque de ${p.codigo}`
                            : `Destacar ${p.codigo}`
                        }
                        aria-pressed={p.destaque}
                        className="rounded-full p-1.5 transition-colors hover:bg-mist"
                      >
                        <Star
                          size={16}
                          aria-hidden="true"
                          className={
                            p.destaque
                              ? "fill-black text-black"
                              : "text-black/30"
                          }
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {p.visualizacoes}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {p.cliquesWhatsApp}
                    </td>
                    <td className="px-4 py-3 text-black/55">
                      {dataCurta(p.atualizadoEm)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/imoveis/${p.id}`}
                          aria-label={`Editar ${p.codigo}`}
                          className="rounded-full p-2 transition-colors hover:bg-mist"
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => excluir(p)}
                          aria-label={`Excluir ${p.codigo}`}
                          className="rounded-full p-2 text-black/60 transition-colors hover:bg-mist hover:text-black"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPaginas > 1 && (
            <nav
              aria-label="Paginação da tabela"
              className="flex items-center justify-between border-t border-black/10 px-4 py-3"
            >
              <p className="text-[12px] text-black/50">
                Página {paginaAtual} de {totalPaginas} · {filtradas.length}{" "}
                imóve{filtradas.length === 1 ? "l" : "is"}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={paginaAtual === 1}
                  onClick={() => setPagina(paginaAtual - 1)}
                  aria-label="Página anterior"
                  className="rounded-full p-2 transition-colors hover:bg-mist disabled:opacity-30"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={paginaAtual === totalPaginas}
                  onClick={() => setPagina(paginaAtual + 1)}
                  aria-label="Próxima página"
                  className="rounded-full p-2 transition-colors hover:bg-mist disabled:opacity-30"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
        </div>
      )}
    </main>
  );
}
