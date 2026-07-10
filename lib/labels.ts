import type {
  StatusImovel,
  SubtipoImovel,
  TipoImovel,
  Transacao,
} from "@prisma/client";

/** Rótulos em português para os enums do banco. */

export const TIPO_LABEL: Record<TipoImovel, string> = {
  RESIDENCIAL: "Residencial",
  COMERCIAL: "Comercial",
  TERRENO: "Terreno",
};

export const SUBTIPO_LABEL: Record<SubtipoImovel, string> = {
  CASA: "Casa",
  SOBRADO: "Sobrado",
  APARTAMENTO: "Apartamento",
  KITNET: "Kitnet",
  CHACARA: "Chácara",
  SALA_COMERCIAL: "Sala comercial",
  LOJA: "Loja",
  GALPAO: "Galpão",
  TERRENO_URBANO: "Terreno",
  TERRENO_CONDOMINIO: "Terreno em condomínio",
};

/** Subtipos válidos para cada tipo — o form só oferece os coerentes. */
export const SUBTIPOS_POR_TIPO: Record<TipoImovel, SubtipoImovel[]> = {
  RESIDENCIAL: ["CASA", "SOBRADO", "APARTAMENTO", "KITNET", "CHACARA"],
  COMERCIAL: ["SALA_COMERCIAL", "LOJA", "GALPAO"],
  TERRENO: ["TERRENO_URBANO", "TERRENO_CONDOMINIO"],
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
