/**
 * Base de conhecimento do "Buganza Suporte" — atendimento por regras
 * (casamento de palavras-chave), sem IA/LLM. Mantém tudo previsível e de
 * custo zero. Quando nenhuma regra casa, o widget oferece o WhatsApp.
 *
 * Para editar as respostas, mexa só neste arquivo.
 */

import { formatarPreco } from "@/lib/format";
import { COMODIDADES, COMODIDADE_LABEL } from "@/lib/comodidades";

/** Categorias que agrupam os assuntos no widget, na ordem de exibição. */
export const CATEGORIAS = [
  "Comprar ou alugar",
  "Anunciar meu imóvel",
  "Sobre a Buganza",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export interface TopicoChat {
  id: string;
  categoria: Categoria;
  /** Texto do botão de resposta rápida (chip). */
  titulo: string;
  /** Palavras/radicais que ativam este tópico quando o usuário digita. */
  chaves: string[];
  resposta: string;
}

export const TOPICOS: TopicoChat[] = [
  {
    id: "visita",
    categoria: "Comprar ou alugar",
    titulo: "Agendar uma visita",
    chaves: ["visita", "visitar", "agendar", "agendamento", "conhecer", "ver o imovel"],
    resposta:
      "Para agendar uma visita é rapidinho: escolha o imóvel, toque em “Falar no WhatsApp” e a gente combina o melhor dia e horário — fazemos visitas inclusive aos sábados. Quer que eu te leve ao WhatsApp agora?",
  },
  {
    id: "precos",
    categoria: "Comprar ou alugar",
    titulo: "Preços e negociação",
    chaves: ["preco", "preço", "valor", "valores", "quanto custa", "quanto e", "quanto é", "negociar", "desconto", "proposta"],
    resposta:
      "O valor de cada imóvel aparece no próprio anúncio (ausência = “Sob consulta”). Para fazer uma proposta ou negociar condições, o melhor caminho é falar direto com um corretor pelo WhatsApp — a negociação é sempre transparente.",
  },
  {
    id: "financiamento",
    categoria: "Comprar ou alugar",
    titulo: "Financiamento",
    chaves: ["financiamento", "financiar", "financia", "banco", "fgts", "parcelar", "credito", "crédito", "entrada"],
    resposta:
      "Sim, cuidamos disso com você: fazemos a simulação nos principais bancos, orientamos sobre o uso do FGTS e acompanhamos todo o processo — sem custo adicional. Posso te conectar com um corretor pelo WhatsApp para simular seu caso.",
  },
  {
    id: "documentos",
    categoria: "Comprar ou alugar",
    titulo: "Documentos para alugar",
    chaves: ["documento", "documentos", "documentacao", "documentação", "alugar", "aluguel", "locacao", "locação", "fiador", "caucao", "caução"],
    resposta:
      "Em geral pedimos documento com foto, comprovante de renda e de residência. Conforme o caso, pode haver fiador, seguro-fiança ou caução — explicamos as opções e ajudamos a escolher a mais simples para você.",
  },
  {
    id: "anunciar",
    categoria: "Anunciar meu imóvel",
    titulo: "Como anunciar meu imóvel",
    chaves: ["anunciar", "anuncio", "anúncio", "vender", "vender meu", "colocar a venda", "colocar à venda", "comissao", "comissão", "taxa", "custo para anunciar"],
    resposta:
      "Anunciar com a Buganza é sem taxa, sem mensalidade e sem exclusividade forçada — você só paga a comissão de corretagem quando o negócio fecha. Cuidamos das fotos, do anúncio e da divulgação. Chame no WhatsApp que fazemos uma avaliação do seu imóvel.",
  },
  {
    id: "cidades",
    categoria: "Sobre a Buganza",
    titulo: "Cidades atendidas",
    chaves: ["cidade", "cidades", "regiao", "região", "onde", "atuam", "atende", "atendem", "sorocaba", "votorantim"],
    resposta:
      "Atuamos em Sorocaba e região — Votorantim, Araçoiaba da Serra, Itu e arredores. Se o imóvel que você procura estiver fora dessa área, indicamos parceiros de confiança.",
  },
  {
    id: "atendimento",
    categoria: "Sobre a Buganza",
    titulo: "Horário de atendimento",
    chaves: ["horario", "horário", "atendimento", "funciona", "aberto", "sabado", "sábado", "domingo", "quando"],
    resposta:
      "Atendemos de segunda a sábado, com flexibilidade para agendar visitas no horário que for melhor para você. Pelo WhatsApp costumamos responder no mesmo dia.",
  },
];

/** Tópicos agrupados por categoria, na ordem de CATEGORIAS. */
export function topicosPorCategoria(): {
  categoria: Categoria;
  topicos: TopicoChat[];
}[] {
  return CATEGORIAS.map((categoria) => ({
    categoria,
    topicos: TOPICOS.filter((t) => t.categoria === categoria),
  })).filter((g) => g.topicos.length > 0);
}

export interface RespostaChat {
  /** true se alguma regra casou; false = fallback para WhatsApp. */
  encontrou: boolean;
  texto: string;
  /** Tópico que casou (para telemetria/depuração futura), se houver. */
  topicoId?: string;
}

const FALLBACK =
  "Essa eu não sei responder por aqui com segurança — mas um corretor te ajuda rapidinho. Posso te levar ao WhatsApp ou pegar seu contato para retornarmos.";

/** Normaliza para casar sem depender de acento/caixa. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Encontra o tópico mais relevante para o texto do usuário. Pontua por
 * número de chaves presentes; empate fica com o primeiro do catálogo.
 */
export function responder(texto: string): RespostaChat {
  const alvo = normalizar(texto);
  if (!alvo.trim()) return { encontrou: false, texto: FALLBACK };

  let melhor: TopicoChat | null = null;
  let melhorPontos = 0;

  for (const topico of TOPICOS) {
    let pontos = 0;
    for (const chave of topico.chaves) {
      if (alvo.includes(normalizar(chave))) pontos++;
    }
    if (pontos > melhorPontos) {
      melhorPontos = pontos;
      melhor = topico;
    }
  }

  if (melhor) {
    return { encontrou: true, texto: melhor.resposta, topicoId: melhor.id };
  }
  return { encontrou: false, texto: FALLBACK };
}

/** Resposta pronta de um tópico pelo id (clique num chip). */
export function respostaDoTopico(id: string): RespostaChat {
  const topico = TOPICOS.find((t) => t.id === id);
  return topico
    ? { encontrou: true, texto: topico.resposta, topicoId: topico.id }
    : { encontrou: false, texto: FALLBACK };
}

/* ------------------------------------------------------------------ */
/* Modo "ciente do imóvel": na página de um anúncio, o bot responde     */
/* perguntas com os DADOS REAIS daquele imóvel (rota /api/chatbot/      */
/* imovel). Sem IA: intenção por palavras-chave + resposta montada do   */
/* banco — nunca inventa informação.                                    */
/* ------------------------------------------------------------------ */

/** Subconjunto público do imóvel que o chat usa (espelho da rota). */
export interface ImovelChat {
  titulo: string;
  codigo: string;
  tipo: string;
  subtipo: string | null;
  transacao: "VENDA" | "LOCACAO" | "VENDA_LOCACAO";
  cidade: string;
  bairro: string;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  areaM2: number | null;
  areaTerrenoM2: number | null;
  precoVenda: string | null;
  precoLocacao: string | null;
  condominioMensal: string | null;
  iptuAnual: string | null;
  comodidades: string[];
}

/** Chips extras exibidos quando a conversa acontece num anúncio. */
export const TOPICOS_IMOVEL = [
  { id: "im-precos", titulo: "Preço e custos" },
  { id: "im-caracteristicas", titulo: "Características" },
  { id: "im-localizacao", titulo: "Localização" },
] as const;

function resumoPrecos(im: ImovelChat): string {
  const venda = formatarPreco(im.precoVenda);
  const locacao = formatarPreco(im.precoLocacao);
  const partes: string[] = [];
  if (venda) partes.push(`Venda: ${venda}`);
  if (locacao) partes.push(`Locação: ${locacao}/mês`);
  let texto =
    partes.length > 0
      ? `${partes.join(" · ")}.`
      : "O preço deste imóvel está sob consulta — o corretor passa o valor e as condições direto no WhatsApp.";

  const custos: string[] = [];
  const cond = formatarPreco(im.condominioMensal);
  const iptu = formatarPreco(im.iptuAnual);
  if (cond) custos.push(`condomínio de ${cond}/mês`);
  if (iptu) custos.push(`IPTU de ${iptu}/ano`);
  if (custos.length > 0) texto += ` Custos: ${custos.join(" e ")}.`;
  if (partes.length > 0) {
    texto += " Para propostas e condições, é só chamar o corretor. 😉";
  }
  return texto;
}

function resumoCaracteristicas(im: ImovelChat): string {
  const partes: string[] = [];
  if (im.quartos) {
    partes.push(
      im.suites
        ? `${im.quartos} quarto${im.quartos > 1 ? "s" : ""} (${im.suites} suíte${im.suites > 1 ? "s" : ""})`
        : `${im.quartos} quarto${im.quartos > 1 ? "s" : ""}`
    );
  }
  if (im.banheiros) partes.push(`${im.banheiros} banheiro${im.banheiros > 1 ? "s" : ""}`);
  if (im.vagas) partes.push(`${im.vagas} vaga${im.vagas > 1 ? "s" : ""}`);
  if (im.areaM2) partes.push(`${im.areaM2} m²`);
  if (im.areaTerrenoM2) partes.push(`terreno de ${im.areaTerrenoM2} m²`);

  let texto =
    partes.length > 0
      ? `Este imóvel tem ${partes.join(" · ")}.`
      : "A ficha completa está na própria página do anúncio.";

  if (im.comodidades.length > 0) {
    const rotulos = im.comodidades
      .slice(0, 6)
      .map((c) => COMODIDADE_LABEL[c] ?? c);
    texto += ` Destaques: ${rotulos.join(", ")}${im.comodidades.length > 6 ? "…" : "."}`;
  }
  return texto;
}

function resumoLocalizacao(im: ImovelChat): string {
  return (
    `Fica no bairro ${im.bairro}, em ${im.cidade}. O mapa da região está ` +
    "na própria página do anúncio, logo abaixo das fotos. O endereço " +
    "exato é passado pelo corretor ao agendar a visita."
  );
}

/** Resposta de um chip de imóvel (id de TOPICOS_IMOVEL). */
export function respostaDoTopicoImovel(
  id: string,
  im: ImovelChat
): RespostaChat {
  if (id === "im-precos") {
    return { encontrou: true, texto: resumoPrecos(im), topicoId: id };
  }
  if (id === "im-caracteristicas") {
    return { encontrou: true, texto: resumoCaracteristicas(im), topicoId: id };
  }
  if (id === "im-localizacao") {
    return { encontrou: true, texto: resumoLocalizacao(im), topicoId: id };
  }
  return { encontrou: false, texto: FALLBACK };
}

/**
 * Tenta responder o texto com os dados do imóvel em tela. Retorna null
 * quando a pergunta não é sobre o imóvel — o chamador cai nas regras
 * gerais (responder). A ORDEM importa: condomínio/IPTU antes de preço,
 * senão "valor do condomínio" cairia na resposta de preço.
 */
export function responderSobreImovel(
  texto: string,
  im: ImovelChat
): RespostaChat | null {
  const alvo = normalizar(texto);
  if (!alvo.trim()) return null;

  const tem = (...radicais: string[]) =>
    radicais.some((r) => alvo.includes(normalizar(r)));

  if (tem("condominio")) {
    const cond = formatarPreco(im.condominioMensal);
    return {
      encontrou: true,
      texto: cond
        ? `O condomínio deste imóvel é de ${cond}/mês.`
        : "Este anúncio não informa valor de condomínio — o corretor confirma na hora pelo WhatsApp.",
      topicoId: "im-precos",
    };
  }

  if (tem("iptu", "imposto")) {
    const iptu = formatarPreco(im.iptuAnual);
    return {
      encontrou: true,
      texto: iptu
        ? `O IPTU deste imóvel é de ${iptu}/ano.`
        : "Este anúncio não informa o IPTU — o corretor confirma na hora pelo WhatsApp.",
      topicoId: "im-precos",
    };
  }

  if (tem("preco", "valor", "quanto custa", "quanto e", "quanto ta", "quanto sai")) {
    return { encontrou: true, texto: resumoPrecos(im), topicoId: "im-precos" };
  }

  if (tem("quarto", "dormitorio", "suite")) {
    return {
      encontrou: true,
      texto: resumoCaracteristicas(im),
      topicoId: "im-caracteristicas",
    };
  }

  if (tem("banheiro", "lavabo")) {
    return {
      encontrou: true,
      texto: im.banheiros
        ? `São ${im.banheiros} banheiro${im.banheiros > 1 ? "s" : ""}.`
        : "O anúncio não detalha os banheiros — o corretor confirma rapidinho.",
      topicoId: "im-caracteristicas",
    };
  }

  if (tem("vaga", "garagem", "estacionamento", "carro")) {
    return {
      encontrou: true,
      texto: im.vagas
        ? `Tem ${im.vagas} vaga${im.vagas > 1 ? "s" : ""} de garagem.`
        : "Este anúncio não lista vaga de garagem — vale confirmar com o corretor.",
      topicoId: "im-caracteristicas",
    };
  }

  if (tem("area", "metragem", "m2", "metro", "tamanho")) {
    const partes: string[] = [];
    if (im.areaM2) partes.push(`${im.areaM2} m² de área útil`);
    if (im.areaTerrenoM2) partes.push(`${im.areaTerrenoM2} m² de terreno`);
    return {
      encontrou: true,
      texto:
        partes.length > 0
          ? `São ${partes.join(" e ")}.`
          : "O anúncio não informa a metragem — o corretor confirma na hora.",
      topicoId: "im-caracteristicas",
    };
  }

  if (tem("onde fica", "localizacao", "endereco", "bairro", "regiao", "mapa", "perto de")) {
    return {
      encontrou: true,
      texto: resumoLocalizacao(im),
      topicoId: "im-localizacao",
    };
  }

  if (tem("codigo", "referencia")) {
    return {
      encontrou: true,
      texto: `O código deste anúncio é ${im.codigo} — cite-o ao falar com o corretor que agiliza. 😉`,
      topicoId: "im-caracteristicas",
    };
  }

  // Comodidade específica: "tem piscina?", "aceita pet?"…
  for (const c of COMODIDADES) {
    const pedacos = normalizar(c.rotulo)
      .split(/[\s/]+/)
      .filter((p) => p.length >= 4);
    if (tem(c.valor, ...pedacos)) {
      const possui = im.comodidades.includes(c.valor);
      return {
        encontrou: true,
        texto: possui
          ? `Sim! Este imóvel tem ${COMODIDADE_LABEL[c.valor].toLowerCase()}. ✅`
          : `Este anúncio não lista "${COMODIDADE_LABEL[c.valor]}" — mas vale confirmar com o corretor, às vezes o condomínio oferece.`,
        topicoId: "im-caracteristicas",
      };
    }
  }

  return null;
}
