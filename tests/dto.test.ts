import { describe, expect, it } from "vitest";
import {
  toPublicPropertyDTO,
  toPublicPropertyDTOList,
  capaDoImovel,
} from "@/lib/dto";

// Simula o Prisma.Decimal — o DTO só precisa do toString()
const decimal = (valor: string) => ({ toString: () => valor });

/** Imóvel completo como sai do Prisma, incluindo os campos SENSÍVEIS. */
function propriedadeFake() {
  return {
    id: "prop-1",
    codigo: "BZ-0001",
    slug: "casa-teste",
    titulo: "Casa de teste",
    descricao: "Descrição da casa.",
    tipo: "RESIDENCIAL",
    transacao: "VENDA",
    status: "ATIVO",
    destaque: true,
    cidade: "Sorocaba",
    bairro: "Centro",
    // preenchido de proposito: o DTO tem que DESCARTAR este valor
    enderecoMapa: "Rua das Palmeiras, 123",
    quartos: 3,
    banheiros: 2,
    vagas: 2,
    areaM2: 150,
    precoVenda: decimal("750000"),
    precoLocacao: null,
    precoInterno: decimal("698000"), // ← JAMAIS pode aparecer no público
    videoUrl: null,
    videoStorageKey: "properties/prop-1/video-x.mp4",
    criadoEm: new Date("2026-01-01"),
    atualizadoEm: new Date("2026-01-02"),
    fotos: [
      {
        id: "foto-2",
        propertyId: "prop-1",
        url: "/b.jpg",
        storageKey: "properties/prop-1/b.jpg",
        ordem: 1,
        capa: true,
        criadoEm: new Date("2026-01-01"),
      },
      {
        id: "foto-1",
        propertyId: "prop-1",
        url: "/a.jpg",
        storageKey: "properties/prop-1/a.jpg",
        ordem: 0,
        capa: false,
        criadoEm: new Date("2026-01-01"),
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("DTO público (regra inviolável do negócio)", () => {
  it("nunca serializa precoInterno — nem a chave, nem o valor", () => {
    const json = JSON.stringify(toPublicPropertyDTO(propriedadeFake()));
    expect(json).not.toContain("precoInterno");
    expect(json).not.toContain("698000");
  });

  it("não vaza campos internos de storage e status", () => {
    const dto = toPublicPropertyDTO(propriedadeFake());
    const json = JSON.stringify(dto);
    expect(json).not.toContain("storageKey");
    expect(json).not.toContain("videoStorageKey");
    expect("status" in dto).toBe(false);
    expect("destaque" in dto).toBe(false);
  });

  it("preços públicos saem como string decimal", () => {
    const dto = toPublicPropertyDTO(propriedadeFake());
    expect(dto.precoVenda).toBe("750000");
    expect(dto.precoLocacao).toBeNull();
  });

  it("fotos vêm ordenadas por ordem, com url/ordem/capa apenas", () => {
    const dto = toPublicPropertyDTO(propriedadeFake());
    expect(dto.fotos.map((f) => f.url)).toEqual(["/a.jpg", "/b.jpg"]);
    expect(Object.keys(dto.fotos[0]).sort()).toEqual(["capa", "ordem", "url"]);
  });

  it("capaDoImovel devolve a foto marcada como capa", () => {
    const dto = toPublicPropertyDTO(propriedadeFake());
    expect(capaDoImovel(dto)?.url).toBe("/b.jpg");
  });

  it("toPublicPropertyDTOList aplica o DTO em todos os itens", () => {
    const lista = toPublicPropertyDTOList([
      propriedadeFake(),
      propriedadeFake(),
    ]);
    expect(lista).toHaveLength(2);
    expect(JSON.stringify(lista)).not.toContain("precoInterno");
  });

  // Guarda de regressao: estes campos NUNCA podem sair em resposta
  // publica. Se alguem adicionar um deles ao DTO, o teste quebra antes
  // de virar vazamento em producao.
  it("nao expoe preco interno nem chaves de storage", () => {
    const dto = toPublicPropertyDTO(propriedadeFake());
    const serializado = JSON.stringify(dto);

    // preco de negociacao interna — jamais publico
    expect(dto).not.toHaveProperty("precoInterno");
    expect(serializado).not.toContain("precoInterno");

    // caminhos internos do storage
    expect(serializado).not.toContain("storageKey");
    expect(serializado).not.toContain("videoStorageKey");
  });

  // Decisao dos DONOS da imobiliaria: o endereco completo nunca aparece
  // no site — o publico ve so o bairro. O campo existe para uso interno e
  // fica visivel apenas no painel (que exige login). Este teste impede
  // que ele volte ao publico sem alguem decidir de novo.
  it("NAO expoe o endereco completo, mesmo preenchido", () => {
    const dto = toPublicPropertyDTO(propriedadeFake());
    const serializado = JSON.stringify(dto);

    expect(dto).not.toHaveProperty("enderecoMapa");
    expect(serializado).not.toContain("enderecoMapa");
    expect(serializado).not.toContain("Rua das Palmeiras");

    // o bairro continua publico — e o que o visitante precisa saber
    expect(dto.bairro).toBeTruthy();
  });
});
