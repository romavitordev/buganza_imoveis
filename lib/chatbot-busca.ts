/**
 * Busca por conversa do "Buganza Suporte" — transforma frases como
 * "apartamento 3 quartos até 500 mil" em filtros do catálogo. Sem IA:
 * expressões regulares sobre o texto normalizado, previsível e grátis.
 *
 * Regra anti-falso-positivo: só vira busca se houver pelo menos UM
 * atributo concreto de imóvel (tipo/subtipo, quartos, vagas ou preço).
 * "quero alugar" sozinho NÃO dispara — senão sequestraria perguntas
 * como "documentos para alugar", que são dos tópicos gerais.
 *
 * Continuidade ("e por mais de 550 mil?", "e para alugar?"): o widget
 * guarda a última busca e usa `extrairContinuacao` + `mesclarBusca`
 * quando a frase nova só traz um pedaço do filtro.
 */

export interface IntencaoBusca {
  tipo?: "RESIDENCIAL" | "COMERCIAL" | "TERRENO";
  subtipo?: "CASA" | "SOBRADO" | "APARTAMENTO" | "KITNET" | "CHACARA";
  transacao?: "VENDA" | "LOCACAO";
  /** Nome EXATO como está no banco (veio de /api/chatbot/lugares). */
  bairro?: string;
  cidade?: string;
  quartosMin?: number;
  vagasMin?: number;
  precoMin?: number;
  precoMax?: number;
  /** Rótulo humano do que foi entendido — ecoado na resposta do bot. */
  resumo: string;
}

/** Vocabulário de lugares do catálogo (bairros/cidades que existem). */
export interface Lugares {
  bairros: string[];
  cidades: string[];
}

const SEM_LUGARES: Lugares = { bairros: [], cidades: [] };

/**
 * Palavras que aparecem em muitos bairros e, sozinhas, não identificam
 * nenhum ("Jardim", "Parque", "Vila"…). Evita que "quero um parque" vire
 * um filtro de bairro.
 */
const PREFIXOS_GENERICOS = new Set([
  "jardim", "jd", "parque", "pq", "vila", "vl", "residencial", "conjunto",
  "bairro", "loteamento", "nucleo", "distrito", "chacara", "chacaras",
  "recanto", "cidade", "alto", "altos", "novo", "nova", "sao", "santa",
  "santo", "dos", "das", "de", "do", "da",
]);

function tokens(texto: string): string[] {
  return normalizar(texto).split(/[^a-z0-9]+/).filter(Boolean);
}

/** `alvo` aparece dentro de `texto` como sequência de palavras inteiras? */
function contemSequencia(texto: string[], alvo: string[]): boolean {
  if (alvo.length === 0 || alvo.length > texto.length) return false;
  for (let i = 0; i <= texto.length - alvo.length; i++) {
    if (alvo.every((t, j) => texto[i + j] === t)) return true;
  }
  return false;
}

/**
 * Acha na frase um lugar do catálogo. Duas passadas, da mais forte para
 * a mais fraca:
 *   1. nome completo, palavra por palavra — entre vários, o de MAIS
 *      palavras ("Parque Campolim" ganha de "Campolim" quando o
 *      visitante escreve os dois nomes)
 *   2. só a parte distintiva ("campolim" de "Parque Campolim"), exigindo
 *      token com 5+ letras e fora da lista de genéricos
 *
 * A comparação é sempre por palavra inteira: "encontro" não pode casar
 * com o bairro "Centro". Devolve o nome EXATO do banco (para o filtro
 * de igualdade bater) ou null.
 */
function acharLugar(alvo: string, nomes: string[]): string | null {
  const doTexto = tokens(alvo);
  let melhor: string | null = null;
  let melhorPalavras = 0;

  for (const nome of nomes) {
    const partes = tokens(nome);
    if (contemSequencia(doTexto, partes) && partes.length > melhorPalavras) {
      melhor = nome;
      melhorPalavras = partes.length;
    }
  }
  if (melhor) return melhor;

  const conjunto = new Set(doTexto);
  for (const nome of nomes) {
    const distintivos = tokens(nome).filter(
      (t) => t.length >= 5 && !PREFIXOS_GENERICOS.has(t)
    );
    if (distintivos.length === 0) continue;
    if (distintivos.every((t) => conjunto.has(t))) {
      if (!melhor || nome.length > melhor.length) melhor = nome;
    }
  }
  return melhor;
}

/**
 * Tira do texto as palavras do lugar já reconhecido. Sem isso, um bairro
 * como "Chácara Recreio" faria o parser achar que o visitante quer uma
 * chácara.
 */
function removerLugar(alvo: string, nome: string): string {
  let resultado = alvo;
  for (const t of tokens(nome)) {
    resultado = resultado.replace(new RegExp(`\\b${t}\\b`, "g"), " ");
  }
  return resultado;
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** "500 mil" → 500000 · "1,5 milhao" → 1500000 · "450.000" → 450000. */
function parsearValor(bruto: string, unidade?: string): number | null {
  const numero = Number(bruto.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(numero) || numero <= 0) return null;
  const fator =
    unidade === "mil" || unidade === "k"
      ? 1_000
      : unidade && unidade.startsWith("milh")
        ? 1_000_000
        : 1;
  const valor = Math.round(numero * fator);
  return valor > 1_000_000_000 ? null : valor;
}

function moeda(v: number): string {
  return v.toLocaleString("pt-BR");
}

/** "dois quartos" → 2 (por extenso até dez). */
const NUMERO_EXTENSO: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
};

const UNIDADE = "(milhoes|milhao|mil|k)"; // mais longo primeiro: "mil" não rouba "milhao"

interface Filtros extends Partial<Omit<IntencaoBusca, "resumo">> {
  partes: string[];
}

/** Extrai TODOS os filtros presentes no texto, sem gatilho mínimo. */
function extrairFiltros(texto: string, lugares: Lugares = SEM_LUGARES): Filtros {
  let alvo = normalizar(texto);
  const f: Filtros = { partes: [] };
  if (!alvo.trim()) return f;

  // ---- lugar (bairro/cidade) PRIMEIRO ---------------------------------
  // O nome sai do texto depois de reconhecido: sem isso, um bairro como
  // "Chácara Recreio" faria o parser achar que o visitante quer chácara.
  const bairro = acharLugar(alvo, lugares.bairros);
  if (bairro) {
    f.bairro = bairro;
    f.partes.push(`em ${bairro}`);
    alvo = removerLugar(alvo, bairro);
  }
  const cidade = acharLugar(alvo, lugares.cidades);
  if (cidade) {
    f.cidade = cidade;
    if (!bairro) f.partes.push(`em ${cidade}`);
    alvo = removerLugar(alvo, cidade);
  }

  // ---- tipo / subtipo -------------------------------------------------
  if (/\b(apartamento|apto|ap)\b/.test(alvo)) {
    f.subtipo = "APARTAMENTO";
    f.partes.push("apartamento");
  } else if (/\bsobrado/.test(alvo)) {
    f.subtipo = "SOBRADO";
    f.partes.push("sobrado");
  } else if (/\b(kitnet|kitinete|quitinete|studio|estudio)\b/.test(alvo)) {
    f.subtipo = "KITNET";
    f.partes.push("kitnet");
  } else if (/\b(chacara|sitio)\b/.test(alvo)) {
    f.subtipo = "CHACARA";
    f.partes.push("chácara");
  } else if (/\bcasa\b/.test(alvo)) {
    f.subtipo = "CASA";
    f.partes.push("casa");
  } else if (/\b(terreno|lote)\b/.test(alvo)) {
    f.tipo = "TERRENO";
    f.partes.push("terreno");
  } else if (/\b(comercial|loja|galpao|sala comercial|ponto)\b/.test(alvo)) {
    f.tipo = "COMERCIAL";
    f.partes.push("comercial");
  }

  // ---- transação ------------------------------------------------------
  if (/\b(alugar|aluguel|locacao|locar)\b/.test(alvo)) {
    f.transacao = "LOCACAO";
    f.partes.push("para alugar");
  } else if (/\b(comprar|compra|venda|a venda|vender)\b/.test(alvo)) {
    f.transacao = "VENDA";
    f.partes.push("à venda");
  }

  // ---- quartos / vagas (dígito ou por extenso) ------------------------
  // "2 a 3 quartos" = pelo menos 2 (o intervalo usa o menor número)
  const quartos = alvo.match(
    /(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\s*(?:(?:a|ou)\s*\d+\s*)?(?:\+\s*)?(quartos?|dormitorios?|dorms?|suites?)/
  );
  if (quartos) {
    const n = NUMERO_EXTENSO[quartos[1]] ?? Number(quartos[1]);
    f.quartosMin = Math.min(n, 10);
    f.partes.push(`${f.quartosMin}+ quartos`);
  }
  const vagas = alvo.match(
    /(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\s*(?:\+\s*)?vagas?/
  );
  if (vagas) {
    const n = NUMERO_EXTENSO[vagas[1]] ?? Number(vagas[1]);
    f.vagasMin = Math.min(n, 10);
    f.partes.push(`${f.vagasMin}+ vagas`);
  }

  // ---- preço: faixa → mínimo → máximo → valor solto --------------------
  // 1) Faixa: "entre 300 e 500 mil", "de 300 a 500 mil". Se só a segunda
  //    ponta tiver unidade, ela vale para as duas ("de 300 a 500 mil").
  const faixa = alvo.match(
    new RegExp(
      `(?:entre|de)\\s*(?:r\\$)?\\s*([\\d.,]+)\\s*${UNIDADE}?\\s*(?:a|e|ate)\\s*(?:r\\$)?\\s*([\\d.,]+)\\s*${UNIDADE}?`
    )
  );
  if (faixa) {
    const unidade1 = faixa[2] ?? faixa[4];
    const min = parsearValor(faixa[1], unidade1);
    const max = parsearValor(faixa[3], faixa[4]);
    if (min && max && min >= 200 && max >= 200 && min < max) {
      f.precoMin = min;
      f.precoMax = max;
      f.partes.push(`entre ${moeda(min)} e ${moeda(max)}`);
    }
  }

  // 2) Mínimo: "mais de", "acima de", "a partir de", "no mínimo"
  if (f.precoMin === undefined && f.precoMax === undefined) {
    const min = alvo.match(
      new RegExp(
        `(?:mais de|acima de|a partir de|no minimo|minimo)\\s*(?:r\\$)?\\s*([\\d.,]+)\\s*${UNIDADE}?`
      )
    );
    if (min) {
      const valor = parsearValor(min[1], min[2]);
      if (valor && valor >= 200) {
        f.precoMin = valor;
        f.partes.push(`acima de ${moeda(valor)}`);
      }
    }
  }

  // 3) Máximo: "até", "no máximo", "menos de", "abaixo de", "por"
  if (f.precoMin === undefined && f.precoMax === undefined) {
    const max = alvo.match(
      new RegExp(
        `(?:ate|maximo|max|abaixo de|menos de|por)\\s*(?:r\\$)?\\s*([\\d.,]+)\\s*${UNIDADE}?`
      )
    );
    if (max) {
      const valor = parsearValor(max[1], max[2]);
      // Número "pelado" pequeno (ex.: "até 3") é contagem, não preço
      if (valor && valor >= 200) {
        f.precoMax = valor;
        f.partes.push(`até ${moeda(valor)}`);
      }
    }
  }

  // 4) Valor solto COM unidade: "apartamento 550 mil" → teto de orçamento
  if (f.precoMin === undefined && f.precoMax === undefined) {
    const solto = alvo.match(new RegExp(`([\\d.,]+)\\s*${UNIDADE}\\b`));
    if (solto) {
      const valor = parsearValor(solto[1], solto[2]);
      if (valor && valor >= 200) {
        f.precoMax = valor;
        f.partes.push(`até ${moeda(valor)}`);
      }
    }
  }

  return f;
}

function montar(f: Filtros): IntencaoBusca {
  const { partes, ...campos } = f;
  return { ...campos, resumo: partes.join(", ") };
}

/**
 * Busca "de primeira": exige atributo concreto (tipo/subtipo, quartos,
 * vagas ou preço) para não sequestrar os tópicos gerais.
 */
export function extrairBusca(
  texto: string,
  lugares: Lugares = SEM_LUGARES
): IntencaoBusca | null {
  const f = extrairFiltros(texto, lugares);
  const temAtributo =
    f.tipo !== undefined ||
    f.subtipo !== undefined ||
    f.bairro !== undefined ||
    f.quartosMin !== undefined ||
    f.vagasMin !== undefined ||
    f.precoMin !== undefined ||
    f.precoMax !== undefined;
  if (!temAtributo) return null;
  return montar(f);
}

/**
 * Continuação de conversa ("e para alugar?", "e por mais de 550 mil?"):
 * aceita QUALQUER filtro, inclusive só a transação — o chamador garante
 * que existe busca anterior e que os tópicos gerais não responderam.
 */
export function extrairContinuacao(
  texto: string,
  lugares: Lugares = SEM_LUGARES
): IntencaoBusca | null {
  const f = extrairFiltros(texto, lugares);
  const temAlgo =
    f.tipo !== undefined ||
    f.subtipo !== undefined ||
    f.transacao !== undefined ||
    f.bairro !== undefined ||
    f.cidade !== undefined ||
    f.quartosMin !== undefined ||
    f.vagasMin !== undefined ||
    f.precoMin !== undefined ||
    f.precoMax !== undefined;
  if (!temAlgo) return null;
  return montar(f);
}

/**
 * Junta a busca anterior com a continuação. Campo novo substitui o
 * antigo; preço substitui EM BLOCO (pedir "mais de 550" depois de
 * "menos de 550" troca a faixa inteira, não vira faixa impossível).
 */
export function mesclarBusca(
  anterior: IntencaoBusca,
  nova: IntencaoBusca
): IntencaoBusca {
  const novaTemPreco =
    nova.precoMin !== undefined || nova.precoMax !== undefined;
  // Espécie do imóvel também troca EM BLOCO: pedir "sala comercial"
  // depois de "casa" não pode manter o subtipo CASA junto.
  const novaTemEspecie = nova.tipo !== undefined || nova.subtipo !== undefined;
  const combinada: IntencaoBusca = {
    tipo: novaTemEspecie ? nova.tipo : anterior.tipo,
    subtipo: novaTemEspecie ? nova.subtipo : anterior.subtipo,
    transacao: nova.transacao ?? anterior.transacao,
    bairro: nova.bairro ?? anterior.bairro,
    cidade: nova.cidade ?? anterior.cidade,
    quartosMin: nova.quartosMin ?? anterior.quartosMin,
    vagasMin: nova.vagasMin ?? anterior.vagasMin,
    precoMin: novaTemPreco ? nova.precoMin : anterior.precoMin,
    precoMax: novaTemPreco ? nova.precoMax : anterior.precoMax,
    resumo: "",
  };

  // Refaz o resumo a partir dos campos combinados
  const partes: string[] = [];
  if (combinada.bairro) partes.push(`em ${combinada.bairro}`);
  else if (combinada.cidade) partes.push(`em ${combinada.cidade}`);
  if (combinada.subtipo) partes.push(combinada.subtipo.toLowerCase());
  else if (combinada.tipo) partes.push(combinada.tipo.toLowerCase());
  if (combinada.transacao) {
    partes.push(combinada.transacao === "LOCACAO" ? "para alugar" : "à venda");
  }
  if (combinada.quartosMin) partes.push(`${combinada.quartosMin}+ quartos`);
  if (combinada.vagasMin) partes.push(`${combinada.vagasMin}+ vagas`);
  if (combinada.precoMin !== undefined && combinada.precoMax !== undefined) {
    partes.push(`entre ${moeda(combinada.precoMin)} e ${moeda(combinada.precoMax)}`);
  } else if (combinada.precoMin !== undefined) {
    partes.push(`acima de ${moeda(combinada.precoMin)}`);
  } else if (combinada.precoMax !== undefined) {
    partes.push(`até ${moeda(combinada.precoMax)}`);
  }
  combinada.resumo = partes.join(", ");
  return combinada;
}

/** A intenção tem filtro de preço? (usado no "plano B" sem faixa) */
export function temFiltroDePreco(b: IntencaoBusca): boolean {
  return b.precoMin !== undefined || b.precoMax !== undefined;
}

/** Cópia da intenção sem a faixa de preço (busca de alternativas). */
export function semPreco(b: IntencaoBusca): IntencaoBusca {
  return { ...b, precoMin: undefined, precoMax: undefined };
}

/** A intenção restringe um bairro? (usado no "plano B" de lugar) */
export function temFiltroDeLugar(b: IntencaoBusca): boolean {
  return b.bairro !== undefined;
}

/** Cópia sem bairro E sem preço — última tentativa antes de desistir. */
export function semLugarNemPreco(b: IntencaoBusca): IntencaoBusca {
  return {
    ...b,
    bairro: undefined,
    precoMin: undefined,
    precoMax: undefined,
  };
}

/** Query string para /api/properties a partir da intenção. */
export function queryDaBusca(b: IntencaoBusca, limit = 4): string {
  const params = new URLSearchParams();
  if (b.tipo) params.set("tipo", b.tipo);
  if (b.subtipo) params.set("subtipo", b.subtipo);
  if (b.transacao) params.set("transacao", b.transacao);
  if (b.bairro) params.set("bairro", b.bairro);
  if (b.cidade) params.set("cidade", b.cidade);
  if (b.quartosMin) params.set("quartosMin", String(b.quartosMin));
  if (b.vagasMin) params.set("vagasMin", String(b.vagasMin));
  if (b.precoMin) params.set("precoMin", String(b.precoMin));
  if (b.precoMax) params.set("precoMax", String(b.precoMax));
  params.set("limit", String(limit));
  return params.toString();
}

/** URL do catálogo (/imoveis) com os filtros equivalentes da intenção. */
export function urlCatalogoDaBusca(b: IntencaoBusca): string {
  const params = new URLSearchParams();
  if (b.tipo) params.set("tipo", b.tipo);
  if (b.transacao) params.set("transacao", b.transacao);
  if (b.bairro) params.set("bairro", b.bairro);
  if (b.cidade) params.set("cidade", b.cidade);
  if (b.quartosMin) params.set("quartos", String(b.quartosMin));
  if (b.precoMin) params.set("precoMin", String(b.precoMin));
  if (b.precoMax) params.set("precoMax", String(b.precoMax));
  // O catálogo não filtra por subtipo — a busca textual cobre bem
  if (b.subtipo) params.set("q", b.subtipo.toLowerCase());
  const qs = params.toString();
  return qs ? `/imoveis?${qs}` : "/imoveis";
}
