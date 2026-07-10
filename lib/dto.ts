import type { Property, PropertyPhoto } from "@prisma/client";

/**
 * DTO PÚBLICO — allowlist explícita de campos.
 *
 * Regra inviolável do negócio: `precoInterno` JAMAIS aparece em resposta
 * pública. Por isso este módulo NUNCA usa spread do objeto Prisma —
 * cada campo é copiado individualmente. Se um campo novo for adicionado
 * ao schema, ele NÃO vaza automaticamente para o site.
 */

export interface PublicPhotoDTO {
  url: string;
  ordem: number;
  capa: boolean;
}

export interface PublicPropertyDTO {
  id: string;
  codigo: string;
  slug: string;
  titulo: string;
  descricao: string;
  tipo: Property["tipo"];
  /** Refino do tipo (Casa, Apartamento, Loja…) — null em anúncios antigos. */
  subtipo: Property["subtipo"];
  transacao: Property["transacao"];
  cidade: string;
  bairro: string;
  /** Endereço opcional para o pino do mapa (o casal decide por imóvel). */
  enderecoMapa: string | null;
  quartos: number | null;
  /** Suítes contam dentro de quartos (3 quartos, sendo 1 suíte). */
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  /** Área útil/construída. */
  areaM2: number | null;
  areaTerrenoM2: number | null;
  /** Preços públicos como string decimal ("750000.00") ou null = sob consulta. */
  precoVenda: string | null;
  precoLocacao: string | null;
  /** Custos recorrentes — exibidos na ficha quando preenchidos. */
  condominioMensal: string | null;
  iptuAnual: string | null;
  /** Comodidades do catálogo (lib/comodidades.ts) — badges no detalhe. */
  comodidades: string[];
  /** Vídeo do imóvel — exibido só no detalhe, nunca como capa. */
  videoUrl: string | null;
  fotos: PublicPhotoDTO[];
}

type PropertyWithPhotos = Property & { fotos: PropertyPhoto[] };

export function toPublicPropertyDTO(
  property: PropertyWithPhotos
): PublicPropertyDTO {
  return {
    id: property.id,
    codigo: property.codigo,
    slug: property.slug,
    titulo: property.titulo,
    descricao: property.descricao,
    tipo: property.tipo,
    subtipo: property.subtipo,
    transacao: property.transacao,
    cidade: property.cidade,
    bairro: property.bairro,
    enderecoMapa: property.enderecoMapa,
    quartos: property.quartos,
    suites: property.suites,
    banheiros: property.banheiros,
    vagas: property.vagas,
    areaM2: property.areaM2,
    areaTerrenoM2: property.areaTerrenoM2,
    precoVenda: property.precoVenda?.toString() ?? null,
    precoLocacao: property.precoLocacao?.toString() ?? null,
    condominioMensal: property.condominioMensal?.toString() ?? null,
    iptuAnual: property.iptuAnual?.toString() ?? null,
    comodidades: property.comodidades ?? [],
    videoUrl: property.videoUrl,
    fotos: property.fotos
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((foto) => ({
        url: foto.url,
        ordem: foto.ordem,
        capa: foto.capa,
      })),
  };
}

export function toPublicPropertyDTOList(
  properties: PropertyWithPhotos[]
): PublicPropertyDTO[] {
  return properties.map(toPublicPropertyDTO);
}

/** Foto de capa (ou primeira foto) de um DTO público. */
export function capaDoImovel(dto: PublicPropertyDTO): PublicPhotoDTO | null {
  return dto.fotos.find((f) => f.capa) ?? dto.fotos[0] ?? null;
}
