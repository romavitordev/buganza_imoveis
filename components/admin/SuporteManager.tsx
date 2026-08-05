"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  MessageCircleQuestion,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { palavrasChaveDe } from "@/lib/chatbot-aprendizado";

interface Pendente {
  id: string;
  texto: string;
  criadoEm: string;
}

interface Conhecimento {
  id: string;
  titulo: string;
  palavras: string[];
  resposta: string;
  ativo: boolean;
}

/**
 * Ensino do chatbot pelo painel: a fila de perguntas sem resposta vira
 * base de conhecimento. Responder uma pergunta cria a resposta E tira a
 * pergunta da fila numa tacada só.
 */
export default function SuporteManager({
  pendentesIniciais,
  conhecimentoInicial,
}: {
  pendentesIniciais: Pendente[];
  conhecimentoInicial: Conhecimento[];
}) {
  const router = useRouter();
  const [pendentes, setPendentes] = useState(pendentesIniciais);
  const [itens, setItens] = useState(conhecimentoInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // Formulário aberto: id da pergunta de origem, "novo" (do zero) ou null
  const [editando, setEditando] = useState<string | null>(null);
  const [emEdicao, setEmEdicao] = useState<Conhecimento | null>(null);
  const [titulo, setTitulo] = useState("");
  const [resposta, setResposta] = useState("");
  const [palavras, setPalavras] = useState("");
  const [paraExcluir, setParaExcluir] = useState<Conhecimento | null>(null);

  // Prévia do que vai realmente ativar a resposta — evita a surpresa de
  // cadastrar algo que nunca dispara
  const chavesPrevia = useMemo(
    () => palavrasChaveDe(palavras, titulo),
    [palavras, titulo]
  );

  function abrirParaPergunta(p: Pendente) {
    setEmEdicao(null);
    setEditando(p.id);
    setTitulo(p.texto.slice(0, 80));
    setPalavras("");
    setResposta("");
    setErro(null);
  }

  function abrirNovo() {
    setEmEdicao(null);
    setEditando("novo");
    setTitulo("");
    setPalavras("");
    setResposta("");
    setErro(null);
  }

  function abrirEdicao(item: Conhecimento) {
    setEmEdicao(item);
    setEditando(item.id);
    setTitulo(item.titulo);
    setPalavras(item.palavras.join(", "));
    setResposta(item.resposta);
    setErro(null);
  }

  function fechar() {
    setEditando(null);
    setEmEdicao(null);
    setErro(null);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setOcupado(true);
    try {
      const editandoExistente = emEdicao !== null;
      const res = await fetch("/api/admin/chatbot", {
        method: editandoExistente ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editandoExistente ? { id: emEdicao.id } : {}),
          titulo,
          resposta,
          palavras,
          // Só quando veio de uma pergunta da fila
          ...(!editandoExistente && editando && editando !== "novo"
            ? { perguntaId: editando }
            : {}),
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        erro?: string;
        conhecimento?: Conhecimento;
      } | null;
      if (!res.ok) throw new Error(body?.erro ?? "Erro ao salvar.");

      if (editandoExistente) {
        setItens((atual) =>
          atual.map((i) =>
            i.id === emEdicao.id ? body?.conhecimento ?? i : i
          )
        );
      } else {
        if (body?.conhecimento) setItens((atual) => [body.conhecimento!, ...atual]);
        if (editando && editando !== "novo") {
          setPendentes((atual) => atual.filter((p) => p.id !== editando));
        }
      }
      fechar();
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setOcupado(false);
    }
  }

  async function ignorar(p: Pendente) {
    setOcupado(true);
    setErro(null);
    try {
      const res = await fetch("/api/admin/chatbot/perguntas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, status: "IGNORADA" }),
      });
      if (!res.ok) throw new Error("Erro ao ignorar a pergunta.");
      setPendentes((atual) => atual.filter((x) => x.id !== p.id));
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao ignorar.");
    } finally {
      setOcupado(false);
    }
  }

  async function alternarAtivo(item: Conhecimento) {
    setOcupado(true);
    try {
      const res = await fetch("/api/admin/chatbot", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, ativo: !item.ativo }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar.");
      setItens((atual) =>
        atual.map((i) => (i.id === item.id ? { ...i, ativo: !i.ativo } : i))
      );
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao atualizar.");
    } finally {
      setOcupado(false);
    }
  }

  async function excluir(item: Conhecimento) {
    setParaExcluir(null);
    setOcupado(true);
    try {
      const res = await fetch(`/api/admin/chatbot?id=${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao remover.");
      setItens((atual) => atual.filter((i) => i.id !== item.id));
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao remover.");
    } finally {
      setOcupado(false);
    }
  }

  const formulario = (
    <form
      onSubmit={salvar}
      className="mt-3 flex flex-col gap-3 rounded-xl border border-black/15 bg-white p-4"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-black/70">
          Assunto (vira o rótulo do atalho no chat)
        </span>
        <input
          required
          maxLength={80}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex.: Administração de condomínio"
          className="rounded-xl border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-black"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-black/70">
          Resposta que o bot vai dar
        </span>
        <textarea
          required
          rows={4}
          maxLength={1500}
          value={resposta}
          onChange={(e) => setResposta(e.target.value)}
          placeholder="Escreva como se estivesse falando com o cliente."
          className="rounded-xl border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-black"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-black/70">
          Palavras-chave (separadas por vírgula) — opcional
        </span>
        <input
          value={palavras}
          onChange={(e) => setPalavras(e.target.value)}
          placeholder="condominio, administracao, sindico"
          className="rounded-xl border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-black"
        />
        <span className="text-[11px] text-black/70">
          {chavesPrevia.length > 0 ? (
            <>
              O bot vai responder quando a mensagem tiver:{" "}
              <strong>{chavesPrevia.join(" · ")}</strong>
            </>
          ) : (
            "Deixe vazio para usar as palavras do assunto."
          )}
        </span>
      </label>

      {erro && (
        <p role="alert" className="rounded-xl bg-black px-4 py-3 text-[13px] text-white">
          {erro}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={ocupado}
          className="inline-flex items-center gap-2 rounded-pill bg-black px-5 py-2.5 text-[13px] font-medium text-white transition-opacity disabled:opacity-60"
        >
          {ocupado ? (
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          ) : (
            <Check size={13} aria-hidden="true" />
          )}
          {emEdicao ? "Salvar alterações" : "Ensinar o bot"}
        </button>
        <button
          type="button"
          onClick={fechar}
          className="rounded-pill border border-black/20 px-5 py-2.5 text-[13px] font-medium transition-colors hover:border-black"
        >
          Cancelar
        </button>
      </div>
    </form>
  );

  return (
    <div className="flex flex-col gap-10">
      {/* ---------- fila de perguntas sem resposta ---------- */}
      <section aria-labelledby="pendentes-titulo">
        <h2 id="pendentes-titulo" className="mb-1 text-lg tracking-tight">
          Perguntas sem resposta ({pendentes.length})
        </h2>
        <p className="mb-4 text-[12px] text-black/70">
          O que os visitantes perguntaram e o bot não soube responder.
          Responda para ele aprender, ou ignore se for só um teste.
        </p>

        {pendentes.length === 0 ? (
          <div className="rounded-2xl bg-mist px-6 py-10 text-center text-sm text-black/70">
            Nenhuma pendência — o bot respondeu tudo que perguntaram. 🎉
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {pendentes.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border border-black/10 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-start gap-2 text-sm">
                      <MessageCircleQuestion
                        size={15}
                        className="mt-0.5 flex-none text-black/70"
                        aria-hidden="true"
                      />
                      <span>“{p.texto}”</span>
                    </p>
                    <p className="mt-1 pl-[23px] text-[11px] text-black/70">
                      {new Date(p.criadoEm).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <button
                      type="button"
                      onClick={() => abrirParaPergunta(p)}
                      className="rounded-pill bg-black px-4 py-2 text-[12px] font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
                    >
                      Responder
                    </button>
                    <button
                      type="button"
                      onClick={() => ignorar(p)}
                      disabled={ocupado}
                      className="rounded-pill border border-black/20 px-4 py-2 text-[12px] font-medium text-black/70 transition-colors hover:border-black hover:text-black disabled:opacity-60"
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
                {editando === p.id && formulario}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- base aprendida ---------- */}
      <section aria-labelledby="base-titulo">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h2 id="base-titulo" className="text-lg tracking-tight">
            Respostas que você ensinou ({itens.length})
          </h2>
          <button
            type="button"
            onClick={abrirNovo}
            className="inline-flex items-center gap-2 rounded-pill border border-black/15 px-4 py-2 text-[12px] font-medium transition-colors hover:border-black"
          >
            <Plus size={13} aria-hidden="true" />
            Nova resposta
          </button>
        </div>
        <p className="mb-4 text-[12px] text-black/70">
          Estas valem junto com as respostas que já vêm prontas no bot.
          Desative uma para tirá-la do ar sem apagar.
        </p>

        {editando === "novo" && formulario}

        {itens.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-mist px-6 py-10 text-center text-sm text-black/70">
            Você ainda não ensinou nenhuma resposta.
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {itens.map((item) => (
              <li key={item.id} className="rounded-2xl border border-black/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {item.titulo}
                      {!item.ativo && (
                        <span className="rounded-pill bg-mist px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-black/70">
                          Desativada
                        </span>
                      )}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[13px] text-black/70">
                      {item.resposta}
                    </p>
                    <p className="mt-1.5 text-[11px] text-black/70">
                      Ativa com: {item.palavras.join(" · ")}
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-1">
                    <button
                      type="button"
                      onClick={() => abrirEdicao(item)}
                      aria-label={`Editar ${item.titulo}`}
                      className="rounded-full p-2 transition-colors hover:bg-mist"
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => alternarAtivo(item)}
                      disabled={ocupado}
                      aria-label={
                        item.ativo
                          ? `Desativar ${item.titulo}`
                          : `Ativar ${item.titulo}`
                      }
                      className="rounded-full p-2 transition-colors hover:bg-mist disabled:opacity-60"
                    >
                      {item.ativo ? (
                        <X size={14} aria-hidden="true" />
                      ) : (
                        <Check size={14} aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setParaExcluir(item)}
                      aria-label={`Excluir ${item.titulo}`}
                      className="rounded-full p-2 text-black/70 transition-colors hover:bg-mist hover:text-black"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {editando === item.id && formulario}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        aberto={paraExcluir !== null}
        titulo="Excluir esta resposta?"
        descricao="O bot deixa de responder esse assunto. Se quiser só pausar, use o botão de desativar."
        rotuloConfirmar="Excluir resposta"
        onConfirmar={() => paraExcluir && excluir(paraExcluir)}
        onCancelar={() => setParaExcluir(null)}
      />
    </div>
  );
}
