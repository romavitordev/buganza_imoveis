"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Trash2 } from "lucide-react";
import type { StatusLead } from "@prisma/client";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export interface AdminLead {
  id: string;
  nome: string;
  whatsapp: string;
  mensagem: string | null;
  origem: string | null;
  status: StatusLead;
  criadoEm: string;
  imovel: { id: string; codigo: string; titulo: string } | null;
}

const STATUS_LEAD_LABEL: Record<StatusLead, string> = {
  NOVO: "Novo",
  CONTATADO: "Contatado",
  DESCARTADO: "Descartado",
};

const STATUS_LEAD_ESTILO: Record<StatusLead, string> = {
  NOVO: "bg-black text-white",
  CONTATADO: "bg-mist text-black/70",
  DESCARTADO: "border border-black/20 text-black/50",
};

export default function LeadsList({
  leadsIniciais,
}: {
  leadsIniciais: AdminLead[];
}) {
  const [leads, setLeads] = useState(leadsIniciais);
  const [filtro, setFiltro] = useState<StatusLead | "TODOS">("TODOS");
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [paraExcluir, setParaExcluir] = useState<AdminLead | null>(null);

  const visiveis = useMemo(
    () =>
      filtro === "TODOS" ? leads : leads.filter((l) => l.status === filtro),
    [leads, filtro]
  );

  async function mudarStatus(lead: AdminLead, status: StatusLead) {
    if (status === lead.status) return;
    setOcupadoId(lead.id);
    setErro(null);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar o lead.");
      setLeads((atual) =>
        atual.map((l) => (l.id === lead.id ? { ...l, status } : l))
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao atualizar o lead.");
    } finally {
      setOcupadoId(null);
    }
  }

  async function excluir(lead: AdminLead) {
    setParaExcluir(null);
    setOcupadoId(lead.id);
    setErro(null);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir o lead.");
      setLeads((atual) => atual.filter((l) => l.id !== lead.id));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir o lead.");
    } finally {
      setOcupadoId(null);
    }
  }

  function dataHora(iso: string): string {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatarWhats(digitos: string): string {
    // 5515998296767 → wa.me aceita direto; exibição amigável básica
    return digitos.replace(
      /^(\d{2})?(\d{2})(\d{4,5})(\d{4})$/,
      (_, pais, ddd, a, b) => `(${ddd}) ${a}-${b}`
    );
  }

  return (
    <>
      <div
        className="mb-6 flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Filtrar leads por status"
      >
        {(["TODOS", "NOVO", "CONTATADO", "DESCARTADO"] as const).map(
          (valor) => {
            const ativo = filtro === valor;
            const quantidade =
              valor === "TODOS"
                ? leads.length
                : leads.filter((l) => l.status === valor).length;
            return (
              <button
                key={valor}
                type="button"
                onClick={() => setFiltro(valor)}
                aria-pressed={ativo}
                className={`rounded-pill border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                  ativo
                    ? "border-black bg-black text-white"
                    : "border-black/12 bg-white text-black/60 hover:border-black/40"
                }`}
              >
                {valor === "TODOS" ? "Todos" : STATUS_LEAD_LABEL[valor]}{" "}
                <span className={ativo ? "opacity-70" : "text-black/35"}>
                  {quantidade}
                </span>
              </button>
            );
          }
        )}
      </div>

      {erro && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-black px-4 py-3 text-[13px] text-white"
        >
          {erro}
        </p>
      )}

      {visiveis.length === 0 ? (
        <div className="rounded-2xl bg-mist px-6 py-16 text-center">
          <p className="text-sm text-black/55">
            {leads.length === 0
              ? "Nenhum lead ainda. Quando um visitante deixar o contato no site, ele aparece aqui."
              : "Nenhum lead com esse status."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visiveis.map((lead) => {
            const ocupado = ocupadoId === lead.id;
            return (
              <li
                key={lead.id}
                className={`rounded-2xl border border-black/10 p-4 md:p-5 ${
                  ocupado ? "opacity-50" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{lead.nome}</p>
                    <p className="mt-0.5 text-[12px] text-black/50">
                      {dataHora(lead.criadoEm)}
                      {lead.origem && ` · via ${lead.origem}`}
                      {lead.imovel && (
                        <>
                          {" · "}
                          <Link
                            href={`/admin/imoveis/${lead.imovel.id}`}
                            className="underline underline-offset-2 hover:text-black"
                          >
                            {lead.imovel.codigo} — {lead.imovel.titulo}
                          </Link>
                        </>
                      )}
                      {!lead.imovel && " · imóvel removido"}
                    </p>
                    {lead.mensagem && (
                      <p className="mt-2 rounded-xl bg-mist px-3 py-2 text-[13px] leading-relaxed text-black/70">
                        “{lead.mensagem}”
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${lead.whatsapp.length <= 11 ? `55${lead.whatsapp}` : lead.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-pill bg-black px-4 py-2 text-[12px] font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
                    >
                      <MessageCircle
                        size={13}
                        strokeWidth={2.5}
                        className="text-[#25D366]"
                        aria-hidden="true"
                      />
                      {formatarWhats(lead.whatsapp)}
                    </a>
                    <select
                      value={lead.status}
                      disabled={ocupado}
                      onChange={(e) =>
                        mudarStatus(lead, e.target.value as StatusLead)
                      }
                      aria-label={`Status do lead de ${lead.nome}`}
                      className={`cursor-pointer appearance-none rounded-pill px-3 py-1.5 text-[11px] font-medium outline-none ${STATUS_LEAD_ESTILO[lead.status]}`}
                    >
                      {Object.entries(STATUS_LEAD_LABEL).map(
                        ([valor, rotulo]) => (
                          <option key={valor} value={valor}>
                            {rotulo}
                          </option>
                        )
                      )}
                    </select>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => setParaExcluir(lead)}
                      aria-label={`Excluir lead de ${lead.nome}`}
                      className="rounded-full p-2 text-black/50 transition-colors hover:bg-mist hover:text-black"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        aberto={paraExcluir !== null}
        titulo={
          paraExcluir ? `Excluir o lead de ${paraExcluir.nome}?` : "Excluir?"
        }
        descricao="Os dados de contato serão apagados definitivamente (LGPD)."
        rotuloConfirmar="Excluir lead"
        onConfirmar={() => paraExcluir && excluir(paraExcluir)}
        onCancelar={() => setParaExcluir(null)}
      />
    </>
  );
}
