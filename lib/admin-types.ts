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

/**
 * A LISTA do painel — só o que a tabela desenha.
 *
 * Existe separado de AdminProperty porque a tabela é a única tela que
 * carrega TODOS os imóveis de uma vez, e mandar o registro inteiro
 * multiplica esse peso por linha. Medido com 303 imóveis e 8 fotos
 * cada: 886 KB no formato completo contra 31 KB assim — e 228 KB do
 * total eram descrições que a tabela nunca mostra.
 *
 * Quem edita um imóvel continua recebendo o AdminProperty inteiro:
 * ali é UM registro, e o formulário precisa de todos os campos.
 */
export interface AdminPropertyResumo {
  id: string;
  codigo: string;
  slug: string;
  titulo: string;
  tipo: TipoImovel;
  transacao: Transacao;
  status: StatusImovel;
  destaque: boolean;
  cidade: string;
  bairro: string;
  atualizadoEm: string;
  criadoEm: string;
  /** Só a capa — é a única que a linha desenha. */
  fotos: AdminPhoto[];
  visualizacoes: number;
  cliquesWhatsApp: number;
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
