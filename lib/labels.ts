import type { StatusImovel, TipoImovel, Transacao } from "@prisma/client";

/** Rótulos em português para os enums do banco. */

export const TIPO_LABEL: Record<TipoImovel, string> = {
  RESIDENCIAL: "Residencial",
  COMERCIAL: "Comercial",
  TERRENO: "Terreno",
};

export const TRANSACAO_LABEL: Record<Transacao, string> = {
  VENDA: "Venda",
  LOCACAO: "Locação",
  VENDA_LOCACAO: "Venda ou Locação",
};

export const STATUS_LABEL: Record<StatusImovel, string> = {
  ATIVO: "Ativo",
  PAUSADO: "Pausado",
  VENDIDO: "Vendido",
  ALUGADO: "Alugado",
};
