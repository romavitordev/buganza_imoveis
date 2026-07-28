/**
 * Busca por conversa do "Buganza Suporte" — transforma frases como
 * "apartamento 3 quartos até 500 mil" em filtros do catálogo. Sem IA:
 * expressões regulares sobre o texto normalizado, previsível e grátis.
 *
 * Regra anti-falso-positivo: só vira busca se houver pelo menos UM
 * atributo concreto de imóvel (tipo/subtipo, quartos, vagas ou preço).
 * "quero alugar" sozinho NÃO dispara — senão sequestraria perguntas
 * como "documentos para alugar", que são dos tópicos gerais.
 */

export interface IntencaoBusca {
  tipo?: "RESIDENCIAL" | "COMERCIAL" | "TERRENO";
  subtipo?: "CASA" | "SOBRADO" | "APARTAMENTO" | "KITNET" | "CHACARA";
  transacao?: "VENDA" | "LOCACAO";
  quartosMin?: number;
  vagasMin?: number;
  precoMax?: number;
  /** Rótulo humano do que foi entendido — ecoado na resposta do bot. */
  resumo: string;
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

export function extrairBusca(texto: string): IntencaoBusca | null {
  const alvo = normalizar(texto);
  if (!alvo.trim()) return null;

  const intencao: Partial<IntencaoBusca> = {};
  const partes: string[] = [];

  // ---- tipo / subtipo -------------------------------------------------
  if (/\b(apartamento|apto|ap)\b/.test(alvo)) {
    intencao.subtipo = "APARTAMENTO";
    partes.push("apartamento");
  } else if (/\bsobrado/.test(alvo)) {
    intencao.subtipo = "SOBRADO";
    partes.push("sobrado");
  } else if (/\b(kitnet|kitinete|quitinete|studio|estudio)\b/.test(alvo)) {
    intencao.subtipo = "KITNET";
    partes.push("kitnet");
  } else if (/\b(chacara|sitio)\b/.test(alvo)) {
    intencao.subtipo = "CHACARA";
    partes.push("chácara");
  } else if (/\bcasa\b/.test(alvo)) {
    intencao.subtipo = "CASA";
    partes.push("casa");
  } else if (/\b(terreno|lote)\b/.test(alvo)) {
    intencao.tipo = "TERRENO";
    partes.push("terreno");
  } else if (/\b(comercial|loja|galpao|sala comercial|ponto)\b/.test(alvo)) {
    intencao.tipo = "COMERCIAL";
    partes.push("comercial");
  } else if (/\bimove(l|is)\b/.test(alvo)) {
    partes.push("imóveis");
  }

  // ---- transação ------------------------------------------------------
  if (/\b(alugar|aluguel|locacao|locar)\b/.test(alvo)) {
    intencao.transacao = "LOCACAO";
    partes.push("para alugar");
  } else if (/\b(comprar|compra|venda|a venda|vender)\b/.test(alvo)) {
    intencao.transacao = "VENDA";
    partes.push("à venda");
  }

  // ---- quartos / vagas ------------------------------------------------
  const quartos = alvo.match(/(\d+)\s*(?:\+\s*)?(quartos?|dormitorios?|dorms?|suites?)/);
  if (quartos) {
    intencao.quartosMin = Math.min(Number(quartos[1]), 10);
    partes.push(`${intencao.quartosMin}+ quartos`);
  }
  const vagas = alvo.match(/(\d+)\s*(?:\+\s*)?vagas?/);
  if (vagas) {
    intencao.vagasMin = Math.min(Number(vagas[1]), 10);
    partes.push(`${intencao.vagasMin}+ vagas`);
  }

  // ---- preço máximo ("até 500 mil", "no maximo r$ 450.000") -----------
  // Alternância do mais longo pro mais curto: "mil" não pode "roubar" o
  // começo de "milhao"
  const preco = alvo.match(
    /(?:ate|maximo|max|abaixo de|menos de|por)\s*(?:r\$)?\s*([\d.,]+)\s*(milhoes|milhao|mil|k)?/
  );
  if (preco) {
    const valor = parsearValor(preco[1], preco[2]);
    if (valor) {
      // Heurística: número "pelado" pequeno (ex.: "até 3") não é preço —
      // provavelmente é contagem; ignora para não poluir a busca.
      if (valor >= 200) {
        intencao.precoMax = valor;
        partes.push(`até ${valor.toLocaleString("pt-BR")}`);
      }
    }
  }

  // ---- gatilho: precisa de atributo concreto ---------------------------
  const temAtributo =
    intencao.tipo !== undefined ||
    intencao.subtipo !== undefined ||
    intencao.quartosMin !== undefined ||
    intencao.vagasMin !== undefined ||
    intencao.precoMax !== undefined;
  if (!temAtributo) return null;

  return { ...intencao, resumo: partes.join(", ") } as IntencaoBusca;
}

/** Query string para /api/properties a partir da intenção. */
export function queryDaBusca(b: IntencaoBusca, limit = 4): string {
  const params = new URLSearchParams();
  if (b.tipo) params.set("tipo", b.tipo);
  if (b.subtipo) params.set("subtipo", b.subtipo);
  if (b.transacao) params.set("transacao", b.transacao);
  if (b.quartosMin) params.set("quartosMin", String(b.quartosMin));
  if (b.vagasMin) params.set("vagasMin", String(b.vagasMin));
  if (b.precoMax) params.set("precoMax", String(b.precoMax));
  params.set("limit", String(limit));
  return params.toString();
}

/** URL do catálogo (/imoveis) com os filtros equivalentes da intenção. */
export function urlCatalogoDaBusca(b: IntencaoBusca): string {
  const params = new URLSearchParams();
  if (b.tipo) params.set("tipo", b.tipo);
  if (b.transacao) params.set("transacao", b.transacao);
  if (b.quartosMin) params.set("quartos", String(b.quartosMin));
  if (b.precoMax) params.set("precoMax", String(b.precoMax));
  // O catálogo não filtra por subtipo — a busca textual cobre bem
  if (b.subtipo) params.set("q", b.subtipo.toLowerCase());
  const qs = params.toString();
  return qs ? `/imoveis?${qs}` : "/imoveis";
}
