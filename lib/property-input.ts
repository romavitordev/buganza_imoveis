import {
  Prisma,
  StatusImovel,
  SubtipoImovel,
  TipoImovel,
  Transacao,
} from "@prisma/client";
import { sanitizarComodidades } from "@/lib/comodidades";
import { normalizarPreco } from "@/lib/preco";
import { SUBTIPOS_POR_TIPO } from "@/lib/labels";

/**
 * Validação dos dados de imóvel vindos do admin.
 * Sem `any`: o payload chega como `unknown` e cada campo é validado.
 */

export interface PropertyInput {
  titulo: string;
  slug?: string;
  descricao: string;
  tipo: TipoImovel;
  subtipo: SubtipoImovel | null;
  transacao: Transacao;
  status: StatusImovel;
  destaque: boolean;
  cidade: string;
  bairro: string;
  enderecoMapa: string | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  areaM2: number | null;
  areaTerrenoM2: number | null;
  precoVenda: Prisma.Decimal | null;
  precoLocacao: Prisma.Decimal | null;
  precoInterno: Prisma.Decimal | null;
  condominioMensal: Prisma.Decimal | null;
  iptuAnual: Prisma.Decimal | null;
  comodidades: string[];
}

export interface ValidationError {
  erro: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function texto(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function inteiroOpcional(value: unknown, campo: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 100000) {
    throw new Error(`Campo "${campo}" deve ser um número inteiro válido.`);
  }
  return n;
}

/** A heurística de parsing vive em lib/preco.ts (compartilhada com o form). */
function decimalOpcional(value: unknown, campo: string): Prisma.Decimal | null {
  const numero = normalizarPreco(value);
  if (numero === null) return null;
  if (Number.isNaN(numero)) {
    throw new Error(`Campo "${campo}" inválido.`);
  }
  return new Prisma.Decimal(numero.toFixed(2));
}

function enumValido<T extends string>(
  value: unknown,
  valores: readonly T[],
  campo: string
): T {
  if (typeof value === "string" && (valores as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new Error(`Campo "${campo}" inválido.`);
}

export function parsePropertyInput(
  payload: unknown
): PropertyInput | ValidationError {
  if (!isRecord(payload)) {
    return { erro: "Corpo da requisição inválido." };
  }

  try {
    const titulo = texto(payload.titulo);
    if (titulo.length < 5) {
      return { erro: "O título deve ter pelo menos 5 caracteres." };
    }
    const descricao = texto(payload.descricao);
    if (descricao.length < 10) {
      return { erro: "A descrição deve ter pelo menos 10 caracteres." };
    }
    const cidade = texto(payload.cidade);
    if (!cidade) return { erro: "Informe a cidade." };
    const bairro = texto(payload.bairro);
    if (!bairro) return { erro: "Informe o bairro." };

    const enderecoMapa = texto(payload.enderecoMapa).slice(0, 160) || null;

    const slugInformado = texto(payload.slug);

    const tipo = enumValido(payload.tipo, Object.values(TipoImovel), "tipo");

    // Subtipo é opcional, mas se vier tem que ser coerente com o tipo
    // (uma "loja residencial" é erro de dado, não de digitação)
    let subtipo: SubtipoImovel | null = null;
    if (payload.subtipo !== null && payload.subtipo !== undefined && payload.subtipo !== "") {
      subtipo = enumValido(
        payload.subtipo,
        Object.values(SubtipoImovel),
        "subtipo"
      );
      if (!SUBTIPOS_POR_TIPO[tipo].includes(subtipo)) {
        return {
          erro: `O subtipo escolhido não é válido para o tipo "${tipo}".`,
        };
      }
    }

    const quartos = inteiroOpcional(payload.quartos, "quartos");
    const suites = inteiroOpcional(payload.suites, "suítes");
    if (suites !== null && quartos !== null && suites > quartos) {
      return { erro: "O número de suítes não pode exceder o de quartos." };
    }

    return {
      titulo,
      slug: slugInformado || undefined,
      descricao,
      tipo,
      subtipo,
      transacao: enumValido(
        payload.transacao,
        Object.values(Transacao),
        "transação"
      ),
      status: enumValido(
        payload.status,
        Object.values(StatusImovel),
        "status"
      ),
      destaque: payload.destaque === true,
      cidade,
      bairro,
      enderecoMapa,
      quartos,
      suites,
      banheiros: inteiroOpcional(payload.banheiros, "banheiros"),
      vagas: inteiroOpcional(payload.vagas, "vagas"),
      areaM2: inteiroOpcional(payload.areaM2, "área útil (m²)"),
      areaTerrenoM2: inteiroOpcional(
        payload.areaTerrenoM2,
        "área do terreno (m²)"
      ),
      precoVenda: decimalOpcional(payload.precoVenda, "preço de venda"),
      precoLocacao: decimalOpcional(payload.precoLocacao, "preço de locação"),
      precoInterno: decimalOpcional(payload.precoInterno, "preço interno"),
      condominioMensal: decimalOpcional(
        payload.condominioMensal,
        "condomínio"
      ),
      iptuAnual: decimalOpcional(payload.iptuAnual, "IPTU"),
      comodidades: sanitizarComodidades(payload.comodidades),
    };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Dados inválidos." };
  }
}

export function isValidationError(
  value: PropertyInput | ValidationError
): value is ValidationError {
  return "erro" in value;
}
