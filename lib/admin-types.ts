import type {
  StatusImovel,
  SubtipoImovel,
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
  subtipo: SubtipoImovel | null;
  transacao: Transacao;
  status: StatusImovel;
  destaque: boolean;
  cidade: string;
  bairro: string;
  /** Endereço opcional usado só para o pino do mapa no site. */
  enderecoMapa: string | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  areaM2: number | null;
  areaTerrenoM2: number | null;
  /** Preços públicos como string ("750000.00") — exibidos no site. */
  precoVenda: string | null;
  precoLocacao: string | null;
  /** Preço interno como string ("1234.56") — visível SÓ no admin. */
  precoInterno: string | null;
  condominioMensal: string | null;
  iptuAnual: string | null;
  comodidades: string[];
  videoUrl: string | null;
  atualizadoEm: string;
  fotos: AdminPhoto[];
  /** Métricas do site público (total acumulado). */
  visualizacoes: number;
  cliquesWhatsApp: number;
}
