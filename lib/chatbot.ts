/**
 * Base de conhecimento do "Buganza Suporte" — atendimento por regras
 * (casamento de palavras-chave), sem IA/LLM. Mantém tudo previsível e de
 * custo zero. Quando nenhuma regra casa, o widget oferece o WhatsApp.
 *
 * Para editar as respostas, mexa só neste arquivo.
 */

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
