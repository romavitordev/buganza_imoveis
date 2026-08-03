/**
 * Identidade da imobiliária em um lugar só.
 *
 * POR QUE ISTO EXISTE: o nome aparecia solto em ~30 textos espalhados
 * por 20+ arquivos. Trocar a marca significava caçar ocorrência por
 * ocorrência, com risco real de esquecer uma (um título de aba, o
 * remetente do e-mail, o emissor do QR da 2FA…). Aqui, renomear é
 * editar `nome` e `nomeCurto` — o resto do site acompanha.
 *
 * Roda no servidor e no cliente: são só textos, nada sensível.
 * (O número de WhatsApp continua server-only, em lib/whatsapp-server.ts.)
 */

const nome = "Imóveis Buganza";
/** Forma curta, para frases: "Anunciar com a Buganza…". */
const nomeCurto = "Buganza";

export const MARCA = {
  nome,
  nomeCurto,
  /** Nome do assistente do chat, no site e nos rótulos de acessibilidade. */
  assistente: `${nomeCurto} Suporte`,
  /** Como o painel administrativo se identifica nos títulos das abas. */
  painel: `Painel ${nomeCurto}`,

  creci: "118400",
  cidade: "Sorocaba",
  uf: "SP",
  /** Usado em textos de cobertura: "Atuamos em Sorocaba e região". */
  regiao: "Sorocaba e região",

  /**
   * E-mail público de contato (rodapé e política de privacidade).
   * TROQUE junto com a marca — hoje é o endereço provisório.
   */
  email: "imoveisbuganza@gmail.com",
} as const;

/** "Sorocaba/SP" — atalho usado em rodapé, OG image e linha do CRECI. */
export const CIDADE_UF = `${MARCA.cidade}/${MARCA.uf}` as const;
