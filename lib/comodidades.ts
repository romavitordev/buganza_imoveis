/**
 * Catálogo de comodidades — a fonte única dos valores aceitos no banco
 * (Property.comodidades) e dos rótulos exibidos no site e no admin.
 * O ícone de cada uma fica em components/ComodidadeIcone.tsx.
 */

export const COMODIDADES = [
  { valor: "piscina", rotulo: "Piscina" },
  { valor: "churrasqueira", rotulo: "Churrasqueira" },
  { valor: "area-gourmet", rotulo: "Área gourmet" },
  { valor: "academia", rotulo: "Academia" },
  { valor: "salao-festas", rotulo: "Salão de festas" },
  { valor: "playground", rotulo: "Playground" },
  { valor: "portaria-24h", rotulo: "Portaria 24h" },
  { valor: "condominio-fechado", rotulo: "Condomínio fechado" },
  { valor: "elevador", rotulo: "Elevador" },
  { valor: "mobiliado", rotulo: "Mobiliado" },
  { valor: "ar-condicionado", rotulo: "Ar-condicionado" },
  { valor: "aquecimento-solar", rotulo: "Aquecimento solar" },
  { valor: "energia-solar", rotulo: "Energia solar" },
  { valor: "quintal", rotulo: "Quintal" },
  { valor: "varanda", rotulo: "Varanda / sacada" },
  { valor: "escritorio", rotulo: "Escritório / home office" },
  { valor: "lavanderia", rotulo: "Lavanderia" },
  { valor: "pet-friendly", rotulo: "Aceita pets" },
] as const;

export type Comodidade = (typeof COMODIDADES)[number]["valor"];

const VALORES = new Set<string>(COMODIDADES.map((c) => c.valor));

export const COMODIDADE_LABEL: Record<string, string> = Object.fromEntries(
  COMODIDADES.map((c) => [c.valor, c.rotulo])
);

/** Mantém apenas valores do catálogo, sem duplicatas, na ordem canônica. */
export function sanitizarComodidades(lista: unknown): string[] {
  if (!Array.isArray(lista)) return [];
  const recebidas = new Set(
    lista.filter((item): item is string => typeof item === "string")
  );
  return COMODIDADES.filter((c) => recebidas.has(c.valor)).map(
    (c) => c.valor
  );
}
