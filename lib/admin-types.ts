import type {
  StatusImovel,
  TipoImovel,
  Transacao,
} from "@prisma/client";

/**
 * Tipos serializáveis (sem Decimal/Date do Prisma) trocados entre
 * server components e client components do admin.
 */

export interface AdminPhoto {
  id: string;
  url: string;
  storageKey: string;
  ordem: number;
  capa: boolean;
}

export interface AdminProperty {
  id: string;
  codigo: string;
  slug: string;
  titulo: string;
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
  /** Preço interno como string ("1234.56") — visível SÓ no admin. */
  precoInterno: string | null;
  atualizadoEm: string;
  fotos: AdminPhoto[];
}
