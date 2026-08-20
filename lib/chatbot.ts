/**
 * Base de conhecimento do "Assistente Marcelo" — atendimento por regras
 * (casamento de palavras-chave), sem IA/LLM. Mantém tudo previsível e de
 * custo zero. Quando nenhuma regra casa, o widget oferece o WhatsApp.
 *
 * Para editar as respostas, mexa só neste arquivo.
 */

import { formatarPreco } from "@/lib/format";
import { COMODIDADES, COMODIDADE_LABEL } from "@/lib/comodidades";
import { MARCA } from "@/lib/marca";

/** Categorias que agrupam os assuntos no widget, na ordem de exibição. */
export const CATEGORIAS = [
  "Comprar ou alugar",
  "Anunciar meu imóvel",
  `Sobre a ${MARCA.nomeCurto}`,
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
      "Para agendar uma visita é rapidinho: escolha o imóvel, toque em “Falar no WhatsApp” e a gente combina o melhor dia e horário — fazemos visitas inclusive aos sábados. Em condomínio, o horário segue as regras do regimento de cada prédio. Quer que eu te leve ao WhatsApp agora?",
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
    chaves: ["documento", "documentos", "documentacao", "documentação", "alugar", "aluguel", "locacao", "locação"],
    resposta:
      "Em geral pedimos documento com foto, comprovante de renda e de residência. Conforme o caso, pode haver uma garantia (fiador, seguro-fiança ou caução) — explicamos as opções e ajudamos a escolher a mais simples para você.",
  },
  {
    id: "garantias",
    categoria: "Comprar ou alugar",
    titulo: "Garantias do aluguel",
    chaves: ["fiador", "seguro fianca", "seguro-fianca", "fianca", "caucao", "caução", "garantia", "titulo de capitalizacao"],
    resposta:
      "As garantias mais comuns são: fiador (com imóvel próprio), seguro-fiança (parcela mensal, sem fiador), caução (até 3 aluguéis adiantados) e título de capitalização. Cada uma tem prós e contras — o corretor te ajuda a escolher a que cabe no seu bolso.",
  },
  {
    id: "docs-compra",
    categoria: "Comprar ou alugar",
    titulo: "Custos de comprar (ITBI, escritura)",
    chaves: ["itbi", "escritura", "cartorio", "cartório", "registro do imovel", "registro do imóvel", "documentos para comprar", "transferencia", "transferência", "custos da compra"],
    resposta:
      "Além do valor do imóvel, planeje os custos de transferência: ITBI (imposto municipal), escritura e registro em cartório. O total varia conforme o valor e a cidade — na proposta a gente te passa a estimativa exata do seu caso, sem surpresa.",
  },
  {
    id: "permuta",
    categoria: "Comprar ou alugar",
    titulo: "Aceita permuta / troca?",
    chaves: ["permuta", "troca", "trocar", "dacao", "dação", "dar meu imovel", "entrada com imovel", "entrada com carro"],
    resposta:
      "Depende do proprietário: alguns aceitam outro imóvel ou veículo como parte do pagamento. Conte para o corretor o que você tem para oferecer — cada negociação é única, com ofertas e permutas, e a gente apresenta a proposta e negocia por você.",
  },
  {
    id: "anunciar",
    categoria: "Anunciar meu imóvel",
    titulo: "Como anunciar meu imóvel",
    chaves: ["anunciar", "anuncio", "anúncio", "vender", "vender meu", "colocar a venda", "colocar à venda", "comissao", "comissão", "taxa", "custo para anunciar"],
    resposta:
      `Anunciar com a ${MARCA.nomeCurto} é sem taxa, sem mensalidade e sem exclusividade forçada — você só paga a comissão de corretagem quando o negócio fecha. Cuidamos das fotos, do anúncio e da divulgação, e a avaliação mercadológica do imóvel vem junto, sem custo. Chame no WhatsApp.`,
  },
  {
    id: "avaliacao",
    categoria: "Anunciar meu imóvel",
    titulo: "Quanto vale meu imóvel?",
    chaves: ["avaliacao", "avaliação", "avaliar", "quanto vale", "precificar", "valor do meu imovel", "valor do meu imóvel"],
    resposta:
      // A ressalva NÃO é detalhe jurídico: sem ela, alguém pede a
      // avaliação de um inventário de graça citando o site. Gratuita é a
      // MERCADOLÓGICA, e só quando o imóvel entra para venda ou locação
      // com eles. Com laudo é serviço cobrado por tabela do CRECI-SP.
      "Fazemos a avaliação mercadológica do seu imóvel sem custo quando ele entra para venda ou locação conosco: comparamos com as vendas recentes da região e indicamos o preço que vende. Avaliação com laudo — para inventário, partilha ou processo — é um serviço à parte, cobrado pela tabela do CRECI-SP. Chame no WhatsApp e agende com um corretor.",
  },
  {
    id: "cidades",
    categoria: `Sobre a ${MARCA.nomeCurto}`,
    titulo: "Cidades atendidas",
    chaves: ["cidade", "cidades", "regiao", "região", "onde", "atuam", "atende", "atendem", "sorocaba", "votorantim"],
    resposta:
      "Atuamos em Sorocaba e região — Votorantim, Araçoiaba da Serra, Itu e arredores. Se o imóvel que você procura estiver fora dessa área, indicamos parceiros de confiança.",
  },
  {
    id: "atendimento",
    categoria: `Sobre a ${MARCA.nomeCurto}`,
    titulo: "Horário de atendimento",
    chaves: ["horario", "horário", "atendimento", "funciona", "aberto", "sabado", "sábado", "domingo", "quando"],
    resposta:
      "Atendemos de segunda a sábado, das 9h às 18h, e agendamos a visita no horário que for melhor para você. Pelo WhatsApp costumamos responder no mesmo dia.",
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
 * Distância de Levenshtein com teto: devolve `limite + 1` assim que a
 * distância estoura o limite (só precisamos saber "é <= limite?").
 */
function distancia(a: string, b: string, limite: number): number {
  if (Math.abs(a.length - b.length) > limite) return limite + 1;
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    let menorDaLinha = i;
    for (let j = 1; j <= b.length; j++) {
      atual[j] = Math.min(
        anterior[j] + 1,
        atual[j - 1] + 1,
        anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      if (atual[j] < menorDaLinha) menorDaLinha = atual[j];
    }
    if (menorDaLinha > limite) return limite + 1;
    anterior = atual;
  }
  return anterior[b.length];
}

/** Tolerância a erro de digitação por tamanho da palavra. */
function toleranciaDe(palavra: string): number {
  if (palavra.length >= 8) return 2; // "financiamento" ← "financiamneto"
  if (palavra.length >= 5) return 1; // "aluguel" ← "alugel"
  return 0; // palavras curtas: só match exato (senão "casa"≈"caso")
}

/**
 * Resposta escrita pelos corretores em /admin/suporte. Entra na mesma
 * disputa dos tópicos fixos — assim a base cresce sem deploy.
 */
export interface TopicoAprendido {
  id: string;
  titulo: string;
  chaves: string[];
  resposta: string;
}

/** Cumprimentos: têm resposta própria para não virarem "não sei". */
const SAUDACOES = [
  "ola", "ole", "oi", "oii", "opa", "eai", "e ai", "hey", "hello",
  "bom dia", "boa tarde", "boa noite",
  "tudo bem", "tudo bom",
];

/**
 * Cumprimentos que pedem resposta ESPELHADA.
 *
 * Responder "Olá!" a quem escreveu "boa noite" é o detalhe que denuncia
 * o robô: qualquer atendente humano devolveria o mesmo cumprimento.
 */
const ESPELHO: Record<string, string> = {
  "bom dia": "Bom dia",
  "boa tarde": "Boa tarde",
  "boa noite": "Boa noite",
};

/**
 * "Tudo bem?" não é cumprimento — é PERGUNTA, e deixá-la sem resposta é
 * exatamente o que soa automático. Quem escreve isso espera ouvir que
 * sim, e ser perguntado de volta.
 *
 * SÓ ESTAS DUAS. Cheguei a incluir "como vai", "como está" e "beleza",
 * e elas custavam caro: "como" é a abertura de pergunta mais comum do
 * português ("como faço para anunciar", "como agendo uma visita"), e
 * pôr essa palavra no vocabulário de saudação é convidar o robô a
 * responder "oi" para quem perguntou algo. "tudo bem" e "tudo bom" não
 * têm esse problema — não começam pergunta sobre imóvel nenhuma.
 */
const BEM_ESTAR = ["tudo bem", "tudo bom"];

/**
 * Curta pelo mesmo motivo da saudação de abertura: os CHIPS de assunto
 * aparecem logo abaixo desta resposta, então listar no texto o que dá
 * para perguntar é repetir em palavras o que já está em botões — e
 * transforma um "oi" numa parede.
 */
function respostaSaudacao(alvo: string): string {
  // O mais longo primeiro: "boa noite" antes de "boa", e assim por
  // diante, para "bom dia" não casar dentro de outra frase.
  const periodo = Object.keys(ESPELHO)
    .sort((a, b) => b.length - a.length)
    .find((chave) => alvo.includes(chave));
  const perguntouComoEstamos = BEM_ESTAR.some((k) => alvo.includes(k));

  // "tudo bem?" sozinho NÃO ganha "Olá!" na frente: ninguém responde
  // "Olá! Tudo bem sim" a quem só perguntou como você está.
  const cumprimentou =
    periodo !== undefined ||
    ["ola", "ole", "oi", "oii", "opa", "eai", "e ai", "hey", "hello"].some(
      (k) => alvo.includes(k)
    );
  const abertura = periodo ? ESPELHO[periodo] : cumprimentou ? "Olá" : null;

  if (perguntouComoEstamos) {
    const inicio = abertura ? `${abertura}! ` : "";
    return `${inicio}Tudo bem sim, e você? 👋 Como posso ajudar?`;
  }
  return `${abertura ?? "Olá"}! 👋 Me diga o que procura, ou escolha um assunto abaixo.`;
}

/**
 * O texto é só um cumprimento? Evita que "oi"/"olá" caia no fallback e
 * ainda polua a lista de perguntas sem resposta do painel.
 */
function ehSaudacao(alvo: string): boolean {
  let resto = alvo.replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!resto) return false;
  // Teto generoso: cumprimentos encadeados ("oi bom dia tudo bem") são
  // comuns, mas ninguém escreve uma pergunta inteira só de saudação.
  if (resto.length > 34) return false;

  /**
   * Uma saudação de verdade quase nunca vem sozinha: "oi, tudo bem?" é
   * a abertura mais comum que existe, e ela caía no fallback — o robô
   * respondia "não sei responder" para um "oi", e a pergunta ainda ia
   * parar na fila do painel.
   *
   * A comparação antiga era do texto INTEIRO contra uma saudação só, e
   * "oi tudo bem" não é igual nem parecido com "tudo bem" (distância 3).
   * Aqui as saudações são REMOVIDAS uma a uma; se no fim não sobrar
   * nada, era só cumprimento. Se sobrar palavra ("oi, quanto custa"),
   * segue para os tópicos normalmente.
   *
   * Do mais longo para o mais curto, senão "oi" comeria o "oi" de
   * "oii" e deixaria um "i" solto.
   */
  // Tokeniza e consome: cada palavra tem que pertencer a alguma
  // saudação. Sem regex montada em runtime — `\b` interpolado num
  // template já custou uma rodada de depuração aqui.
  const palavrasDeSaudacao = new Set(
    SAUDACOES.flatMap((s) => s.split(" ")).concat(["e", "ai", "ae", "entao"])
  );
  const sobra = resto
    .split(" ")
    .filter((palavra) => palavra && !palavrasDeSaudacao.has(palavra));
  if (sobra.length === 0) return true;

  // Nada sobrou de significativo? Ainda pode ser um cumprimento com
  // erro de digitação ("bom diaa"). Aí sim vale a tolerância de 1 letra.
  const limpo = alvo.replace(/[^a-z\s]/g, "").trim();
  if (limpo.length > 14) return false;
  return SAUDACOES.some((s) => {
    const limite = s.length >= 3 ? 1 : 0;
    return limite > 0 && distancia(limpo, s, limite) <= limite;
  });
}

/**
 * Encontra o tópico mais relevante para o texto do usuário. Pontua por
 * chave presente (2 pontos) ou parecida — erro de digitação — (1 ponto);
 * empate fica com o primeiro do catálogo.
 *
 * `aprendidos` são as respostas cadastradas no painel; elas participam da
 * mesma pontuação e, no empate, vencem — quem escreveu conhece o caso
 * melhor que a regra genérica.
 */
export function responder(
  texto: string,
  aprendidos: TopicoAprendido[] = []
): RespostaChat {
  const alvo = normalizar(texto);
  if (!alvo.trim()) return { encontrou: false, texto: FALLBACK };
  if (ehSaudacao(alvo)) {
    return {
      encontrou: true,
      texto: respostaSaudacao(alvo),
      topicoId: "saudacao",
    };
  }
  const tokens = alvo.split(/[^a-z0-9$]+/).filter(Boolean);

  let melhor: TopicoChat | TopicoAprendido | null = null;
  let melhorPontos = 0;

  for (const topico of [...aprendidos, ...TOPICOS]) {
    let pontos = 0;
    for (const chave of topico.chaves) {
      const chaveNorm = normalizar(chave);
      if (alvo.includes(chaveNorm)) {
        pontos += 2;
        continue;
      }
      // Fuzzy só em chave de UMA palavra (frases exigem match direto)
      if (chaveNorm.includes(" ")) continue;
      const limite = toleranciaDe(chaveNorm);
      if (limite === 0) continue;
      if (tokens.some((t) => distancia(t, chaveNorm, limite) <= limite)) {
        pontos += 1;
      }
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
