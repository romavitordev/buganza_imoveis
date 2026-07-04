import { Prisma, StatusImovel, TipoImovel, Transacao } from "@prisma/client";

/**
 * Validação dos dados de imóvel vindos do admin.
 * Sem `any`: o payload chega como `unknown` e cada campo é validado.
 */

export interface PropertyInput {
  titulo: string;
  slug?: string;
  descricao: string;
  tipo: TipoImovel;
  transacao: Transacao;
  status: StatusImovel;
  destaque: boolean;
  cidade: string;
  bairro: string;
  quartos: number | null;
  banheiros: number | null;
  vagas: number | null;
  areaM2: number | null;
  precoVenda: Prisma.Decimal | null;
  precoLocacao: Prisma.Decimal | null;
  precoInterno: Prisma.Decimal | null;
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

function decimalOpcional(value: unknown, campo: string): Prisma.Decimal | null {
  if (value === null || value === undefined || value === "") return null;
  const texto = String(value)
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const numero = Number(typeof value === "number" ? value : texto);
  if (!Number.isFinite(numero) || numero < 0) {
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

    const slugInformado = texto(payload.slug);

    return {
      titulo,
      slug: slugInformado || undefined,
      descricao,
      tipo: enumValido(
        payload.tipo,
        Object.values(TipoImovel),
        "tipo"
      ),
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
      quartos: inteiroOpcional(payload.quartos, "quartos"),
      banheiros: inteiroOpcional(payload.banheiros, "banheiros"),
      vagas: inteiroOpcional(payload.vagas, "vagas"),
      areaM2: inteiroOpcional(payload.areaM2, "área (m²)"),
      precoVenda: decimalOpcional(payload.precoVenda, "preço de venda"),
      precoLocacao: decimalOpcional(payload.precoLocacao, "preço de locação"),
      precoInterno: decimalOpcional(payload.precoInterno, "preço interno"),
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
