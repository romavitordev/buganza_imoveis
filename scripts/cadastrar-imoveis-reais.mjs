/**
 * Cadastra os sete imóveis REAIS enviados pelos donos em 08/09/2026 e
 * apaga os três de demonstração que ocupavam o catálogo local.
 *
 * POR QUE UM SCRIPT, E NÃO O PAINEL: são sete cadastros longos, e
 * digitá-los à mão é onde nasce o erro de um zero a mais no preço. Aqui
 * os dados ficam escritos, revisáveis lado a lado com a mensagem
 * original, e o cadastro pode ser refeito do zero quantas vezes for
 * preciso.
 *
 * NADA AQUI FOI INVENTADO. Todo campo veio das mensagens. O que não foi
 * informado fica vazio — e vazio, no site, vira "Sob consulta" ou
 * simplesmente não aparece na ficha.
 *
 * TRÊS IMÓVEIS NASCEM PAUSADOS porque falta o que nenhum palpite pode
 * suprir (transação, preço). PAUSADO não aparece no site: eles ficam
 * visíveis só no painel, esperando o dado que falta.
 *
 *   node scripts/cadastrar-imoveis-reais.mjs           # só mostra
 *   node scripts/cadastrar-imoveis-reais.mjs --aplicar # grava
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const aplicar = process.argv.includes("--aplicar");
const forcar = process.argv.includes("--forcar-remoto");

/**
 * Este script APAGA o catálogo inteiro antes de recriar. É o que se quer
 * no banco local, que existe justamente para ser refeito à vontade — e é
 * a pior coisa possível apontado, por descuido, para produção: o catálogo
 * real some, e as fotos já enviadas pelo painel vão junto, porque o
 * onDelete: Cascade leva PropertyPhoto.
 *
 * A distância entre as duas coisas é uma variável de ambiente trocada.
 * Num banco que não seja localhost, então, ele só roda com
 * --forcar-remoto escrito à mão.
 */
const ehLocal = /localhost|127[.]0[.]0[.]1/.test(process.env.DATABASE_URL ?? "");

/**
 * IPTU: o campo do banco é ANUAL e o site escreve "IPTU R$ X/ano".
 * Os donos informam valores MENSAIS ("IPTU R$ 1.000 por mês"). Cadastrar
 * o número como veio anunciaria R$ 1.000/ano num imóvel que paga
 * R$ 12.000 — erro que o interessado desconta da conta dele.
 *
 * Enquanto o campo não vira mensal, a conversão fica explícita aqui, com
 * o valor original ao lado, para a revisão ser possível a olho.
 */
const porMes = (valor) => valor * 12;

const IMOVEIS = [
  {
    titulo: "Casa térrea no Condomínio Ibiti do Paço",
    slug: "casa-terrea-condominio-ibiti-do-paco",
    tipo: "RESIDENCIAL",
    subtipo: "CASA",
    transacao: "VENDA_LOCACAO",
    status: "ATIVO",
    destaque: true,
    cidade: "Sorocaba",
    bairro: "Ibiti do Paço",
    areaM2: 220,
    quartos: 3,
    suites: 1,
    banheiros: 3,
    precoVenda: 990000,
    /**
     * O aluguel veio como "Pacote de Aluguel com condomínio e IPTU
     * R$ 6.000" — um número que JÁ SOMA os três. Por isso condomínio e
     * IPTU ficam vazios: preenchidos, a ficha exibiria os três em
     * sequência e passaria a impressão de que se paga condomínio e IPTU
     * além dos 6.000. A descrição diz que está tudo incluído.
     */
    precoLocacao: 6000,
    comodidades: [
      "piscina",
      "churrasqueira",
      "playground",
      "condominio-fechado",
      "quadra",
      "mini-market",
    ],
    descricao: [
      "Casa térrea de 220 m² no Condomínio Ibiti do Paço, bem distribuída, com 3 quartos, sendo 1 suíte, e 3 banheiros.",
      "Ampla cozinha com churrasqueira e uma bela piscina.",
      "O condomínio oferece área verde de jardim, parquinho infantil, espaço para festas, quadra poliesportiva, pista de skate, lago, feira dentro do condomínio e mini market.",
      "Próximo a bons colégios e comércio.",
      "O valor de locação de R$ 6.000 é um pacote e já inclui condomínio e IPTU.",
    ].join("\n\n"),
  },

  {
    titulo: "Apartamento mobiliado no Trix Home Horto",
    slug: "apartamento-mobiliado-trix-home-horto",
    tipo: "RESIDENCIAL",
    subtipo: "APARTAMENTO",
    transacao: "LOCACAO",
    status: "ATIVO",
    cidade: "Sorocaba",
    // Os donos informaram só "Trix Home Horto", que é o nome do
    // empreendimento. Confirmar o bairro e ajustar.
    bairro: "Horto",
    areaM2: 60,
    quartos: 2,
    suites: 1,
    vagas: 1,
    precoLocacao: 2500,
    condominioMensal: 428,
    iptuAnual: porMes(55), // informado como 55/mês
    comodidades: [
      "mobiliado",
      "piscina",
      "quadra",
      "playground",
      "mini-market",
      "salao-festas",
      "area-gourmet",
    ],
    descricao: [
      "Apartamento de 60 m² no Trix Home Horto, 100% mobiliado, com 2 dormitórios, sendo 1 suíte.",
      "Sala de 2 ambientes ampliada e 1 vaga de garagem.",
      "O prédio conta com piscina, quadra, playground, mini market e salão de festas com espaço gourmet.",
    ].join("\n\n"),
  },

  {
    titulo: "Barracão de 200 m² na Vila Gabriel",
    slug: "barracao-200m2-vila-gabriel",
    tipo: "COMERCIAL",
    subtipo: "GALPAO",
    transacao: "LOCACAO",
    status: "ATIVO",
    cidade: "Sorocaba",
    bairro: "Vila Gabriel",
    areaM2: 200,
    // Sem preço de propósito: "Coloque valor sob consulta, vou confirmar
    // valor na segunda". Vazio, o site mostra "Sob consulta" sozinho.
    comodidades: [],
    descricao:
      "Barracão de 200 m² para locação na Vila Gabriel, em Sorocaba. Fale com a gente pelo WhatsApp para saber o valor e agendar uma visita.",
  },

  {
    titulo: "Casa com 4 vagas cobertas em Santa Rosália",
    slug: "casa-4-vagas-santa-rosalia",
    tipo: "RESIDENCIAL",
    subtipo: "CASA",
    /**
     * PAUSADO: os donos não informaram se é venda ou locação, nem o
     * preço. VENDA aqui é só o valor que o banco exige para salvar — não
     * é informação confirmada, e é por isso que o imóvel não vai ao ar.
     */
    transacao: "VENDA",
    status: "PAUSADO",
    cidade: "Sorocaba",
    bairro: "Santa Rosália",
    quartos: 3,
    suites: 1,
    vagas: 4,
    comodidades: ["vaga-coberta", "acessibilidade", "lavanderia"],
    descricao: [
      "Excelente casa em Santa Rosália com 4 vagas cobertas e espaço para até 8 carros.",
      "São 3 dormitórios, sendo 1 suíte, sala ampla com acessibilidade, cozinha e lavanderia.",
      "Conta ainda com uma casa adicional de 2 cômodos grandes e 1 garagem coberta.",
    ].join("\n\n"),
  },

  {
    titulo: "Apartamento no Fit Campolim",
    slug: "apartamento-fit-campolim",
    tipo: "RESIDENCIAL",
    subtipo: "APARTAMENTO",
    // PAUSADO pelo mesmo motivo da casa acima: sem transação e sem preço.
    transacao: "VENDA",
    status: "PAUSADO",
    cidade: "Sorocaba",
    bairro: "Campolim",
    areaM2: 55,
    quartos: 2,
    suites: 1,
    vagas: 1,
    /**
     * "Cond. 850 / IPTU 6.100" chegou entre este apartamento e a casa da
     * Aldeia da Mata, e pode ser de qualquer um dos dois. Fica vazio nos
     * DOIS: custo de condomínio errado numa ficha é o tipo de número que
     * o interessado usa para decidir se visita.
     */
    comodidades: [
      "varanda",
      "piscina",
      "academia",
      "brinquedoteca",
      "area-gourmet",
      "salao-festas",
      "mini-market",
    ],
    descricao: [
      "Apartamento de 55 m² no Fit Campolim, com 2 dormitórios, sendo 1 suíte, e 1 vaga.",
      "Sala de 2 ambientes com varanda.",
      "O prédio conta com piscina, academia, brinquedoteca, salão gourmet, salão de festas e mini market.",
    ].join("\n\n"),
  },

  {
    titulo: "Casa no Condomínio Aldeia da Mata",
    slug: "casa-condominio-aldeia-da-mata",
    tipo: "RESIDENCIAL",
    subtipo: "CASA",
    transacao: "VENDA",
    status: "ATIVO",
    destaque: true,
    // Único fora de Sorocaba. O site atende "Sorocaba e região".
    cidade: "Votorantim",
    bairro: "Aldeia da Mata",
    areaTerrenoM2: 600,
    quartos: 3,
    suites: 3,
    precoVenda: 1600000,
    comodidades: [
      "piscina",
      "churrasqueira",
      "area-gourmet",
      "lareira",
      "aquecimento-solar",
      "ar-condicionado",
      "portaria-24h",
      "condominio-fechado",
      "quadra",
      "playground",
      "quintal",
    ],
    descricao: [
      "Belíssima casa em condomínio fechado na região de Sorocaba, com localização fantástica, a 10 minutos do Iguatemi Shopping.",
      "Muito bem construída, com área de terreno de 600 m² composta por 2 lotes. Conta com 3 suítes, sendo a master com hidromassagem.",
      "O quintal espaçoso tem piscina aquecida com hidro, anexa ao espaço gourmet com churrasqueira. Na sala, uma lareira para os dias mais frios; os quartos são preparados para ar-condicionado.",
      "Armários planejados na cozinha, despensa espaçosa e aquecimento solar.",
      "O condomínio tem portaria 24 horas, quadra, espaço gourmet com churrasqueira e playground.",
      "Estuda-se permuta parcial por casa de menor valor em condomínio.",
    ].join("\n\n"),
  },

  {
    titulo: "Casa no Condomínio Bosque São Bento, no Campolim",
    slug: "casa-condominio-bosque-sao-bento-campolim",
    tipo: "RESIDENCIAL",
    subtipo: "CASA",
    transacao: "VENDA_LOCACAO",
    status: "ATIVO",
    destaque: true,
    cidade: "Sorocaba",
    bairro: "Campolim",
    areaTerrenoM2: 1680,
    areaM2: 720,
    quartos: 4,
    suites: 4,
    precoVenda: 4250000,
    precoLocacao: 20000,
    condominioMensal: 2800,
    iptuAnual: porMes(1000), // informado como "R$ 1.000 por mês"
    comodidades: ["condominio-fechado"],
    descricao: [
      "Casa no Condomínio Bosque São Bento, no Campolim, com terreno de 1.680 m² e 720 m² de área construída.",
      "Sala de jantar, sala de estar, sala de TV e 4 suítes.",
      "Conta ainda com casa de apoio de 2 dormitórios.",
    ].join("\n\n"),
  },
];

function prefixo(n) {
  return `MIS-${String(n).padStart(4, "0")}`;
}

async function main() {
  if (!ehLocal && aplicar && !forcar) {
    console.log(
      [
        "",
        "X  Este banco NAO e local, e o script apaga o catalogo inteiro",
        "   antes de recriar - inclusive as fotos ja enviadas pelo painel.",
        "",
        "   Para popular producao do zero, de proposito:",
        "     node scripts/cadastrar-imoveis-reais.mjs --aplicar --forcar-remoto",
        "",
        "   Se JA existe catalogo em producao, NAO use este script:",
        "   cadastre ou edite pelo painel em /admin.",
        "",
      ].join("\n")
    );
    process.exitCode = 1;
    return;
  }

  const existentes = await prisma.property.findMany({
    select: { codigo: true, titulo: true },
    orderBy: { codigo: "asc" },
  });

  console.log(`\nBanco: ${ehLocal ? "LOCAL" : "REMOTO (!)"}`);
  console.log(`\nSerão APAGADOS ${existentes.length} imóvel(is):`);
  existentes.forEach((i) => console.log(`  − ${i.codigo}  ${i.titulo}`));

  console.log(`\nSerão CRIADOS ${IMOVEIS.length}:`);
  IMOVEIS.forEach((i, n) => {
    const preco = i.precoVenda
      ? `venda R$ ${i.precoVenda.toLocaleString("pt-BR")}`
      : i.precoLocacao
        ? `locação R$ ${i.precoLocacao.toLocaleString("pt-BR")}`
        : "sob consulta";
    const marca = i.status === "PAUSADO" ? "⏸ pausado" : "● ativo  ";
    console.log(`  + ${prefixo(n + 1)}  ${marca}  ${i.titulo}`);
    console.log(`              ${i.cidade}/${i.bairro} · ${preco}`);
  });

  if (!aplicar) {
    console.log("\nNada foi alterado. Para gravar:");
    console.log("  node scripts/cadastrar-imoveis-reais.mjs --aplicar\n");
    return;
  }

  await prisma.$transaction(async (tx) => {
    // onDelete: Cascade leva fotos e eventos junto.
    await tx.property.deleteMany({});
    for (const [n, imovel] of IMOVEIS.entries()) {
      await tx.property.create({
        data: { codigo: prefixo(n + 1), ...imovel },
      });
    }
  });

  const total = await prisma.property.count();
  const ativos = await prisma.property.count({ where: { status: "ATIVO" } });
  console.log(`\n✔ Pronto: ${total} imóveis, ${ativos} ativos no site.`);
  console.log("  Os pausados esperam transação e preço.\n");
}

main()
  .catch((e) => {
    console.error("\n✖", e.message, "\n");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
