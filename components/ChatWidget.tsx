"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Check, Loader2, MessageCircle, Search, Send, X } from "lucide-react";
import { BrandMark } from "@/components/SiteNav";
import {
  CATEGORIAS,
  TOPICOS,
  TOPICOS_IMOVEL,
  responder,
  responderSobreImovel,
  respostaDoTopico,
  respostaDoTopicoImovel,
  type Categoria,
  type ImovelChat,
  type TopicoAprendido,
} from "@/lib/chatbot";
import {
  extrairBusca,
  extrairContinuacao,
  mesclarBusca,
  queryDaBusca,
  semLugarNemPreco,
  semPreco,
  temFiltroDeLugar,
  temFiltroDePreco,
  urlCatalogoDaBusca,
  type IntencaoBusca,
  type Lugares,
} from "@/lib/chatbot-busca";
import { capaDoImovel, type PublicPropertyDTO } from "@/lib/dto";
import { precoPrincipal } from "@/lib/format";
import { linkWhatsAppGeral, linkWhatsAppImovel } from "@/lib/whatsapp";
import { MARCA } from "@/lib/marca";

/**
 * "Assistente Marcelo" — widget de atendimento flutuante, fechado por padrão
 * no canto inferior direito, presente em todas as páginas. Responde a
 * dúvidas frequentes por regras (lib/chatbot.ts); quando não sabe, oferece
 * o WhatsApp. Também captura leads (nome + WhatsApp) → /api/leads, ligando
 * ao imóvel quando a conversa acontece numa página de detalhe.
 */

interface Bolha {
  de: "bot" | "user";
  texto: ReactNode;
}

/**
 * Que atalhos acompanham uma resposta do bot. A navegação tem dois
 * níveis para não jogar uma parede de opções na cara do visitante:
 * primeiro as CATEGORIAS ("Comprar ou alugar"…), e só dentro delas os
 * assuntos. Cada mensagem guarda os próprios chips — por isso o nível
 * é um parâmetro, e não um estado global.
 */
type Nivel =
  | { tipo: "categorias" }
  | { tipo: "topicos"; categoria: Categoria };

const PREFIXO_CATEGORIA = "cat:";

const SAUDACAO =
  `Olá! Sou o assistente da ${MARCA.nome} 👋 Escreva sua dúvida — ou diga o que procura, como “apartamento de 2 quartos até 500 mil”.`;

export default function ChatWidget() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Bolha[]>([
    { de: "bot", texto: SAUDACAO },
  ]);
  const [entrada, setEntrada] = useState("");
  // Modo "deixar contato": troca o input livre pelo mini-formulário de lead
  const [modoContato, setModoContato] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const fimRef = useRef<HTMLDivElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  // slug do imóvel quando a conversa acontece numa página de detalhe
  const slugImovel = pathname?.startsWith("/imoveis/")
    ? pathname.split("/")[2] || undefined
    : undefined;
  const hrefWhats = slugImovel
    ? linkWhatsAppImovel(slugImovel)
    : linkWhatsAppGeral();

  // Dados reais do imóvel em tela (modo "ciente do imóvel"). Carregado
  // na primeira abertura do chat; falha silenciosa = segue o modo geral.
  const [imovel, setImovel] = useState<ImovelChat | null>(null);
  const slugCarregadoRef = useRef<string | null>(null);
  useEffect(() => {
    if (!aberto || !slugImovel) return;
    if (slugCarregadoRef.current === slugImovel) return;
    slugCarregadoRef.current = slugImovel;
    fetch(`/api/chatbot/imovel?slug=${encodeURIComponent(slugImovel)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { imovel?: ImovelChat } | null) => {
        if (body?.imovel) setImovel(body.imovel);
      })
      .catch(() => {
        // Sem dados do imóvel o bot só perde o "modo contextual" — a
        // conversa geral continua funcionando normalmente.
      });
  }, [aberto, slugImovel]);

  // Troca de página = o imóvel em tela mudou
  useEffect(() => {
    if (slugCarregadoRef.current && slugCarregadoRef.current !== slugImovel) {
      slugCarregadoRef.current = null;
      setImovel(null);
      // A saudação que cita o anúncio não vale mais fora dele: volta à
      // padrão ENQUANTO a conversa não começou. Se o visitante já
      // perguntou algo, o histórico é preservado (jogar fora a conversa
      // dele numa troca de página seria pior que a saudação errada).
      setMensagens((atual) =>
        atual.length === 1 && atual[0].de === "bot"
          ? [{ de: "bot", texto: SAUDACAO }]
          : atual
      );
    }
  }, [slugImovel]);

  // Bairros/cidades que existem no catálogo — vocabulário para reconhecer
  // lugares na conversa ("apartamento no Campolim"). Carregado uma vez,
  // na primeira abertura; falhar só desliga o filtro por lugar.
  const [lugares, setLugares] = useState<Lugares>({
    bairros: [],
    cidades: [],
  });
  // Respostas que os corretores escreveram em /admin/suporte — entram na
  // mesma disputa dos tópicos fixos, então a base cresce sem deploy.
  const [aprendidos, setAprendidos] = useState<TopicoAprendido[]>([]);
  const lugaresPedidosRef = useRef(false);
  useEffect(() => {
    if (!aberto || lugaresPedidosRef.current) return;
    lugaresPedidosRef.current = true;
    fetch("/api/chatbot/lugares")
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Lugares | null) => {
        if (body?.bairros) setLugares(body);
      })
      .catch(() => {});
    fetch("/api/chatbot/conhecimento")
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { topicos?: TopicoAprendido[] } | null) => {
        if (body?.topicos?.length) setAprendidos(body.topicos);
      })
      .catch(() => {
        // Sem a base aprendida o bot volta aos tópicos fixos — degrada bem
      });
  }, [aberto]);

  // Rola para a última mensagem a cada atualização
  useEffect(() => {
    if (aberto) fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, aberto, modoContato]);

  // Esc fecha o painel
  useEffect(() => {
    if (!aberto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aberto]);

  function empurrar(bolha: Bolha) {
    setMensagens((atual) => [...atual, bolha]);
  }

  // Saudação contextual: quando os dados do imóvel chegam e a conversa
  // ainda não começou, o bot se apresenta já "sabendo" qual anúncio é.
  useEffect(() => {
    if (!imovel) return;
    setMensagens((atual) =>
      atual.length === 1 && atual[0].de === "bot"
        ? [
            {
              de: "bot",
              texto:
                `Olá! Você está vendo o anúncio “${imovel.titulo}” ` +
                `(${imovel.codigo}). Posso responder sobre preço, custos, ` +
                "características e localização dele — ou qualquer outra dúvida. 👋",
            },
          ]
        : atual
    );
  }, [imovel]);

  /**
   * Bloco que acompanha cada resposta do bot: CTAs (WhatsApp / contato) e
   * — para a conversa não "acabar" — chips com OUTRAS dúvidas (menos a que
   * acabou de ser respondida), para o visitante continuar perguntando.
   */
  function acoesBot(
    nivel: Nivel = { tipo: "categorias" },
    topicoRespondidoId?: string
  ): ReactNode {
    const dentroDeCategoria = nivel.tipo === "topicos";

    // Nível 1 = categorias; nível 2 = assuntos daquela categoria
    const opcoes = dentroDeCategoria
      ? TOPICOS.filter(
          (t) => t.categoria === nivel.categoria && t.id !== topicoRespondidoId
        ).map((t) => ({ id: t.id, titulo: t.titulo }))
      : CATEGORIAS.map((c) => ({ id: `${PREFIXO_CATEGORIA}${c}`, titulo: c }));

    // Na página de um anúncio, os atalhos do imóvel ficam sempre à mão
    const chipsImovel =
      imovel && !dentroDeCategoria
        ? TOPICOS_IMOVEL.filter((t) => t.id !== topicoRespondidoId)
        : [];

    const chip =
      "rounded-pill border border-black/15 bg-white px-2.5 py-1 text-[11px] font-medium text-black/70 transition-colors hover:border-black hover:text-black";

    return (
      <div className="mt-3 flex flex-col gap-2">
        <a
          href={hrefWhats}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-pill bg-black px-4 py-2.5 text-[12px] font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
        >
          <MessageCircle
            size={13}
            strokeWidth={2.5}
            aria-hidden="true"
          />
          Falar no WhatsApp
        </a>
        <button
          type="button"
          onClick={iniciarContato}
          className="rounded-pill border border-black/15 px-4 py-2.5 text-[12px] font-medium text-black/70 transition-colors hover:border-black"
        >
          Deixar meu contato
        </button>

        {chipsImovel.length > 0 && (
          <div className="mt-1 border-t border-black/8 pt-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-black/70">
              Sobre este imóvel
            </p>
            <div className="flex flex-wrap gap-1.5">
              {chipsImovel.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChip(t.id)}
                  className={chip}
                >
                  {t.titulo}
                </button>
              ))}
            </div>
          </div>
        )}

        {opcoes.length > 0 && (
          <div className="mt-1 border-t border-black/8 pt-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-black/70">
              {dentroDeCategoria
                ? "Escolha o assunto"
                : "Posso ajudar em mais algo?"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {opcoes.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onChip(o.id)}
                  className={chip}
                >
                  {o.titulo}
                </button>
              ))}
              {dentroDeCategoria && (
                <button
                  type="button"
                  onClick={voltarAosAssuntos}
                  className="rounded-pill px-2.5 py-1 text-[11px] font-medium text-black/70 underline underline-offset-2 transition-colors hover:text-black"
                >
                  ← Outros assuntos
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  function responderTexto(texto: string, resposta: ReturnType<typeof responder>) {
    empurrar({ de: "user", texto });
    // Depois de responder, o visitante fica DENTRO da categoria do
    // assunto — os vizinhos são o que ele provavelmente quer a seguir.
    const topico = TOPICOS.find((t) => t.id === resposta.topicoId);
    const nivel: Nivel = topico
      ? { tipo: "topicos", categoria: topico.categoria }
      : { tipo: "categorias" };
    empurrar({
      de: "bot",
      texto: (
        <>
          {resposta.texto}
          {acoesBot(nivel, resposta.topicoId)}
        </>
      ),
    });
  }

  /** Volta do nível 2 (assuntos) para o nível 1 (categorias). */
  function voltarAosAssuntos() {
    empurrar({
      de: "bot",
      texto: (
        <>
          Claro! Sobre o que você quer saber?
          {acoesBot({ tipo: "categorias" })}
        </>
      ),
    });
  }

  function onChip(id: string) {
    // Categoria: abre o 2º nível com os assuntos dela
    if (id.startsWith(PREFIXO_CATEGORIA)) {
      const categoria = id.slice(PREFIXO_CATEGORIA.length) as Categoria;
      empurrar({ de: "user", texto: categoria });
      empurrar({
        de: "bot",
        texto: (
          <>
            Sobre <strong>{categoria.toLowerCase()}</strong>, posso ajudar
            com:
            {acoesBot({ tipo: "topicos", categoria })}
          </>
        ),
      });
      return;
    }
    // Chips do imóvel em tela têm prioridade sobre os assuntos gerais.
    // Nas mensagens antigas o onClick guarda o imóvel daquele momento
    // (closure), então o atalho segue respondendo sobre o anúncio certo
    // mesmo que o visitante já tenha mudado de página.
    const topicoImovel = TOPICOS_IMOVEL.find((t) => t.id === id);
    if (topicoImovel && imovel) {
      responderTexto(topicoImovel.titulo, respostaDoTopicoImovel(id, imovel));
      return;
    }
    const topico = TOPICOS.find((t) => t.id === id);
    if (!topico) return;
    responderTexto(topico.titulo, respostaDoTopico(id));
  }

  // Última busca respondida — permite continuar a conversa ("e por mais
  // de 550 mil?", "e para alugar?") sem repetir tudo.
  const ultimaBuscaRef = useRef<IntencaoBusca | null>(null);

  function cardsDeImoveis(resultados: PublicPropertyDTO[]): ReactNode {
    return (
      <span className="mt-2.5 flex flex-col gap-2">
        {resultados.map((p) => {
          const capa = capaDoImovel(p);
          const preco = precoPrincipal(p) ?? "Sob consulta";
          return (
            <a
              key={p.slug}
              href={`/imoveis/${p.slug}`}
              className="flex items-center gap-2.5 rounded-xl border border-black/10 bg-white p-2 transition-colors hover:border-black"
            >
              <span className="relative h-12 w-16 flex-none overflow-hidden rounded-lg bg-mist">
                {capa && (
                  <Image
                    src={capa.url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-medium text-black">
                  {p.titulo}
                </span>
                <span className="block text-[11px] text-black/70">
                  {p.bairro} · <strong>{preco}</strong>
                </span>
              </span>
            </a>
          );
        })}
      </span>
    );
  }

  async function pesquisar(intencao: IntencaoBusca): Promise<PublicPropertyDTO[]> {
    try {
      const res = await fetch(`/api/properties?${queryDaBusca(intencao)}`);
      const body = (await res.json().catch(() => null)) as {
        properties?: PublicPropertyDTO[];
      } | null;
      return body?.properties ?? [];
    } catch {
      // Falha de rede: trata como "nenhum resultado" e oferece o catálogo
      return [];
    }
  }

  /**
   * Busca por conversa: consulta o catálogo com os filtros extraídos da
   * frase e responde com mini-cards clicáveis. Sem resultado na faixa de
   * preço pedida, o bot é HONESTO: avisa que não achou e mostra o que
   * tem de mais próximo fora da faixa. A conversa nunca "quebra".
   */
  async function buscarImoveis(texto: string, intencao: IntencaoBusca) {
    ultimaBuscaRef.current = intencao;
    empurrar({ de: "user", texto });
    empurrar({
      de: "bot",
      texto: (
        <span className="inline-flex items-center gap-2">
          <Search size={13} aria-hidden="true" />
          Procurando {intencao.resumo} no nosso catálogo…
        </span>
      ),
    });

    const resultados = await pesquisar(intencao);
    const urlCatalogo = urlCatalogoDaBusca(intencao);

    if (resultados.length > 0) {
      empurrar({
        de: "bot",
        texto: (
          <>
            Encontrei{" "}
            {resultados.length === 1 ? "este imóvel" : "estes imóveis"} para
            você: 👇
            {cardsDeImoveis(resultados)}
            <a
              href={urlCatalogo}
              className="mt-2 inline-block text-[12px] font-medium underline underline-offset-2"
            >
              Ver todos no catálogo →
            </a>
          </>
        ),
      });
      return;
    }

    // Plano B em dois níveis: relaxa primeiro o preço, depois o bairro —
    // sempre dizendo O QUE foi relaxado, para o visitante nunca achar que
    // o pedido foi atendido.
    let alternativas: PublicPropertyDTO[] = [];
    let ressalva = "";

    if (temFiltroDePreco(intencao)) {
      alternativas = (await pesquisar(semPreco(intencao))).slice(0, 2);
      if (alternativas.length > 0) ressalva = "fora dessa faixa de preço";
    }
    if (alternativas.length === 0 && temFiltroDeLugar(intencao)) {
      alternativas = (await pesquisar(semLugarNemPreco(intencao))).slice(0, 2);
      if (alternativas.length > 0) {
        ressalva = temFiltroDePreco(intencao)
          ? "em outros bairros e fora dessa faixa de preço"
          : `em outros bairros (fora de ${intencao.bairro})`;
      }
    }

    empurrar({
      de: "bot",
      texto:
        alternativas.length > 0 ? (
          <>
            Não encontrei {intencao.resumo} no momento. 😕 Mas, {ressalva},
            tenho {alternativas.length === 1 ? "esta opção" : "estas opções"}{" "}
            que pode{alternativas.length === 1 ? "" : "m"} valer a pena:
            {cardsDeImoveis(alternativas)}
            <a
              href={urlCatalogo}
              className="mt-2 inline-block text-[12px] font-medium underline underline-offset-2"
            >
              Ver o catálogo com esses filtros →
            </a>
            {acoesBot()}
          </>
        ) : (
          <>
            Não encontrei nada com esse perfil agora — mas imóveis novos
            entram toda semana.{" "}
            <a
              href={urlCatalogo}
              className="font-medium underline underline-offset-2"
            >
              Veja o catálogo completo
            </a>{" "}
            ou deixe seu contato que avisamos quando chegar algo assim.
            {acoesBot()}
          </>
        ),
    });
  }

  function onEnviarTexto(e: FormEvent) {
    e.preventDefault();
    const texto = entrada.trim();
    if (!texto) return;
    setEntrada("");
    // Ordem de prioridade: busca INEQUÍVOCA (tipo + outro atributo, ex.
    // "casa 3 quartos até 500 mil") → dados do imóvel em tela → busca
    // simples → regras gerais. Assim "quanto custa?" no anúncio responde
    // o preço real, mas quem descreve outro imóvel cai na busca.
    // Busca "forte" = pedido novo e completo (espécie do imóvel + outro
    // atributo) → começa do zero. As demais são refinamentos e herdam a
    // busca anterior.
    const busca = extrairBusca(texto, lugares);
    const buscaForte =
      busca !== null &&
      (busca.tipo !== undefined || busca.subtipo !== undefined) &&
      (busca.bairro !== undefined ||
        busca.quartosMin !== undefined ||
        busca.vagasMin !== undefined ||
        busca.precoMin !== undefined ||
        busca.precoMax !== undefined ||
        busca.transacao !== undefined);
    if (busca && buscaForte) {
      void buscarImoveis(texto, busca);
      return;
    }
    const contextual = imovel ? responderSobreImovel(texto, imovel) : null;
    if (contextual) {
      responderTexto(texto, contextual);
      return;
    }
    if (busca) {
      // Busca "fraca" (sem tipo de imóvel) logo após outra busca é um
      // refinamento: "e por mais de 550 mil?" herda "apartamento, 2+
      // quartos" da conversa. Busca forte (acima) sempre começa do zero.
      const alvo = ultimaBuscaRef.current
        ? mesclarBusca(ultimaBuscaRef.current, busca)
        : busca;
      void buscarImoveis(texto, alvo);
      return;
    }
    const resposta = responder(texto, aprendidos);
    if (resposta.encontrou) {
      responderTexto(texto, resposta);
      return;
    }
    // Continuidade da busca: os tópicos gerais não souberam, mas há uma
    // busca anterior e a frase traz um pedaço de filtro ("e por mais de
    // 550 mil?", "e para alugar?") → refaz a busca combinando os dois.
    const continuacao = ultimaBuscaRef.current
      ? extrairContinuacao(texto, lugares)
      : null;
    if (continuacao && ultimaBuscaRef.current) {
      void buscarImoveis(
        texto,
        mesclarBusca(ultimaBuscaRef.current, continuacao)
      );
      return;
    }
    // Pergunta sem resposta vira aprendizado: registra (só o texto,
    // nada do visitante) para o painel mostrar o que falta na base.
    void fetch("/api/chatbot/pergunta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    }).catch(() => {});
    responderTexto(texto, resposta);
  }

  function iniciarContato() {
    setModoContato(true);
    empurrar({
      de: "bot",
      texto:
        "Perfeito! Deixe seu nome e WhatsApp que um corretor retorna — normalmente no mesmo dia.",
    });
  }

  // O widget é para visitantes do site — não aparece no painel admin.
  // (return depois dos hooks para não violar as regras do React)
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/* Botão flutuante — fica acima da bottom nav no mobile */}
      {!aberto && (
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label={`Abrir atendimento ${MARCA.assistente}`}
          className="fixed right-4 bottom-[5.5rem] z-[70] inline-flex items-center gap-2.5 rounded-pill bg-black px-6 py-4 text-[15px] font-medium text-white shadow-[0_10px_36px_rgba(0,0,0,0.28)] transition-transform duration-200 ease-premium hover:-translate-y-0.5 md:bottom-5 md:right-5"
        >
          <MessageCircle size={22} strokeWidth={2} aria-hidden="true" />
          Suporte
        </button>
      )}

      {/* Painel do chat */}
      {aberto && (
        <div
          ref={painelRef}
          role="dialog"
          aria-label={MARCA.assistente}
          className="fixed inset-x-4 bottom-4 z-[70] flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_16px_56px_rgba(0,0,0,0.24)] md:inset-x-auto md:right-6 md:bottom-6 md:h-[560px] md:max-h-[80vh] md:w-[380px]"
        >
          {/* Cabeçalho */}
          <header className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              {/* 24px dentro do círculo de 36: com o logotipo real, o
                  tamanho padrão (30) encostava na borda e o desenho
                  ficava sem ar em volta. */}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mist">
                <BrandMark size={24} />
              </span>
              <div>
                <p className="text-sm font-semibold tracking-tight">
                  {MARCA.assistente}
                </p>
                <p className="flex items-center gap-1.5 text-[11px] text-black/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" />
                  Online agora
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar atendimento"
              className="rounded-full p-1.5 text-black/70 transition-colors hover:bg-mist hover:text-black"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          {/* Conversa */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {mensagens.map((m, i) => (
              <div
                key={i}
                className={m.de === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    m.de === "user"
                      ? "bg-black text-white"
                      : "bg-mist text-black/80"
                  }`}
                >
                  {m.texto}
                </div>
              </div>
            ))}

            {/* Abertura enxuta: nada de parede de opções. Na página de um
                anúncio ficam só os 3 atalhos do imóvel; o resto dos
                assuntos aparece depois da primeira mensagem. */}
            {mensagens.length === 1 && !modoContato && (
              <div className="flex flex-col gap-3 pt-1">
                {imovel && (
                  <div className="flex flex-wrap gap-2">
                    {TOPICOS_IMOVEL.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onChip(t.id)}
                        className="rounded-pill border border-black bg-black px-3 py-1.5 text-[12px] font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
                      >
                        {t.titulo}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    empurrar({
                      de: "bot",
                      texto: (
                        <>
                          Sobre o que você quer saber?
                          {acoesBot({ tipo: "categorias" })}
                        </>
                      ),
                    })
                  }
                  className="w-fit text-[12px] font-medium text-black/70 underline underline-offset-2 transition-colors hover:text-black"
                >
                  Ver assuntos frequentes
                </button>
              </div>
            )}

            {modoContato && !enviado && (
              <ContatoForm
                slug={slugImovel}
                onEnviado={() => {
                  setEnviado(true);
                  empurrar({
                    de: "bot",
                    texto:
                      "Recebemos seu contato! Um corretor vai te chamar no WhatsApp em breve. 🙌",
                  });
                  setModoContato(false);
                }}
              />
            )}

            <div ref={fimRef} />
          </div>

          {/* Entrada de texto — escondida durante o formulário de contato */}
          {!modoContato && (
            <form
              onSubmit={onEnviarTexto}
              className="flex items-center gap-2 border-t border-black/10 p-3"
            >
              <input
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                placeholder="Escreva sua dúvida…"
                aria-label="Sua mensagem"
                className="flex-1 rounded-pill border border-black/15 px-4 py-2.5 text-sm outline-none transition-colors focus:border-black"
              />
              <button
                type="submit"
                aria-label="Enviar"
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-black text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
              >
                <Send size={15} aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}

/** Mini-formulário de captura de lead dentro do chat. */
function ContatoForm({
  slug,
  onEnviado,
}: {
  slug?: string;
  onEnviado: () => void;
}) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [site, setSite] = useState(""); // honeypot
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          whatsapp,
          mensagem: `Contato pelo chat do site (${MARCA.assistente}).`,
          slug,
          site,
          origem: "chat",
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        erro?: string;
      } | null;
      if (!res.ok) throw new Error(body?.erro ?? "Erro ao enviar.");
      onEnviado();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-3"
    >
      <input
        required
        minLength={2}
        maxLength={80}
        autoComplete="name"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Seu nome"
        aria-label="Seu nome"
        className="rounded-xl border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-black"
      />
      <input
        required
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        placeholder="WhatsApp com DDD"
        aria-label="Seu WhatsApp"
        className="rounded-xl border border-black/15 px-3.5 py-2.5 text-sm outline-none focus:border-black"
      />
      {/* Honeypot anti-bot */}
      <input
        type="text"
        name="site"
        value={site}
        onChange={(e) => setSite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      {erro && (
        <p role="alert" className="text-[12px] font-medium text-black">
          {erro}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex items-center justify-center gap-2 rounded-pill bg-black px-4 py-2.5 text-[12px] font-medium text-white transition-opacity disabled:opacity-60"
      >
        {enviando ? (
          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
        ) : (
          <Check size={13} aria-hidden="true" />
        )}
        {enviando ? "Enviando…" : "Enviar contato"}
      </button>
      <p className="text-[10px] leading-relaxed text-black/70">
        Ao enviar, você concorda com nossa{" "}
        <a href="/privacidade" className="underline underline-offset-2">
          política de privacidade
        </a>
        .
      </p>
    </form>
  );
}
