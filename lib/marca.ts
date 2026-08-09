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

const nome = "Marcelo Imóveis";
/** Forma curta, para frases: "Anunciar com a Marcelo…". */
const nomeCurto = "Marcelo Imóveis";

export const MARCA = {
  nome,
  nomeCurto,
  /** Assinatura do logotipo — usada no rodapé e na imagem de compartilhamento. */
  tagline: "Conectando pessoas aos melhores lugares.",
  /** Nome do assistente do chat, no site e nos rótulos de acessibilidade. */
  assistente: "Assistente Marcelo",
  /** Como o painel administrativo se identifica nos títulos das abas. */
  painel: "Painel Marcelo Imóveis",

  creci: "118400",
  cidade: "Sorocaba",
  uf: "SP",
  /** Usado em textos de cobertura: "Atuamos em Sorocaba e região". */
  regiao: "Sorocaba e região",

  /**
   * E-mail público de contato (rodapé e política de privacidade).
   * TROQUE quando o endereço definitivo existir.
   */
  email: "contato@marceloimoveis.com.br",
  /** Perfil do Instagram, sem o @ — confira antes de publicar. */
  instagram: "marceloimoveis.sorocaba",
} as const;

/** "Sorocaba/SP" — atalho usado em rodapé, OG image e linha do CRECI. */
export const CIDADE_UF = `${MARCA.cidade}/${MARCA.uf}` as const;

/**
 * IDENTIFICAÇÃO DO CONTROLADOR — exigida pela LGPD.
 *
 * O art. 9º, I da Lei 13.709/2018 obriga a informar QUEM trata os dados,
 * e o art. 41 obriga a indicar um ENCARREGADO com contato divulgado
 * publicamente. Não dá para inventar: são o CNPJ e o endereço reais da
 * empresa, e a pessoa que de fato vai responder aos pedidos.
 *
 * Enquanto estiverem vazios, a política mostra um aviso no lugar — feio
 * de propósito, para ninguém publicar sem preencher. Ver a Fase 2 do
 * CHECKLIST-DEPLOY.md.
 *
 * O encarregado NÃO precisa ser advogado nem funcionário dedicado: numa
 * imobiliária pequena costuma ser um dos sócios. O que a lei exige é que
 * exista alguém identificado e um canal que funcione.
 */
export const CONTROLADOR = {
  /** Razão social completa, como no cartão CNPJ. */
  razaoSocial: "",
  /** Só dígitos ou formatado — entra na página como está. */
  cnpj: "",
  /** Endereço da sede, com CEP. */
  endereco: "",
  encarregado: {
    nome: "",
    /** Pode ser o mesmo e-mail de contato, se for lido de verdade. */
    email: "",
  },
} as const;

/** true quando dá para publicar a política sem lacuna legal. */
export const CONTROLADOR_COMPLETO = Boolean(
  CONTROLADOR.razaoSocial &&
    CONTROLADOR.cnpj &&
    CONTROLADOR.endereco &&
    CONTROLADOR.encarregado.nome &&
    CONTROLADOR.encarregado.email
);

/**
 * Cores da marca, tiradas do logotipo.
 *
 * REGRA DE CONTRASTE (não quebre): o dourado sobre branco dá apenas
 * 2,4:1 — muito abaixo do mínimo de 4,5:1 da WCAG. Ele é DECORATIVO:
 * divisores, detalhes de ícone e texto sobre o azul-escuro. Nunca em
 * texto pequeno sobre fundo claro. O azul-marinho, sim, é a tinta
 * principal: 13:1 sobre branco, melhor que muitos cinzas.
 */
export const CORES = {
  /** Azul-marinho do logotipo — substitui o preto como tinta principal. */
  marinho: "#14264A",
  /** Variação mais clara, para gradientes e estados de hover. */
  marinhoClaro: "#1E3A6B",
  /** Dourado do logotipo — SÓ decorativo (ver regra acima). */
  dourado: "#C6A052",
  /** Dourado mais claro, para brilhos e gradientes. */
  douradoClaro: "#E0C27E",
} as const;
