import {
  PrismaClient,
  SubtipoImovel,
  TipoImovel,
  Transacao,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { MARCA } from "@/lib/marca";

const prisma = new PrismaClient();

async function main() {
  // ---------- Admin ----------
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Defina ADMIN_EMAIL e ADMIN_PASSWORD no .env antes de rodar o seed."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  /**
   * TROCA DE E-MAIL DO ADMIN: migrar, nunca duplicar.
   *
   * Um `upsert` por e-mail parece certo, mas tem uma falha silenciosa:
   * no dia em que o ADMIN_EMAIL muda, o `where` deixa de casar e o seed
   * CRIA um segundo admin — deixando o antigo no banco, com a senha
   * ainda valendo. Vira um login que ninguém lembra que existe e que
   * nenhuma troca de senha futura alcança.
   *
   * Foi exatamente o que aconteceu aqui quando a imobiliária saiu do
   * e-mail provisório para o definitivo.
   *
   * Então: se existe UM admin e o e-mail dele é outro, o que se quer é
   * renomear aquele admin, não somar mais um. Com dois ou mais, o seed
   * não adivinha qual migrar e prefere avisar a errar.
   */
  const admins = await prisma.adminUser.findMany({ select: { id: true, email: true } });
  const orfaos = admins.filter((a) => a.email !== email);

  if (admins.length === 1 && orfaos.length === 1) {
    await prisma.adminUser.update({
      where: { id: orfaos[0].id },
      data: { nome: MARCA.nome, email, passwordHash },
    });
    console.log(`✔ Admin migrado: ${orfaos[0].email} → ${email}`);
  } else {
    await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash },
      create: { nome: MARCA.nome, email, passwordHash },
    });
    console.log(`✔ Admin criado/atualizado: ${email}`);

    if (orfaos.length > 0) {
      console.warn(
        [
          "",
          `⚠  Existem ${orfaos.length} admin(s) com outro e-mail neste banco:`,
          ...orfaos.map((a) => `   • ${a.email}`),
          "   Cada um ainda entra no painel com a senha que tinha.",
          "   Apague os que não forem mais usados antes de publicar.",
          "",
        ].join("\n")
      );
    }
  }

  // ---------- Imóveis de exemplo ----------
  //
  // EM PRODUÇÃO O CATÁLOGO NASCE VAZIO.
  //
  // Estes três imóveis são de demonstração — endereços, textos e preços
  // inventados, fotos de banco de imagem. Rodar o seed no banco de
  // produção com eles publicaria anúncio falso no site de uma
  // imobiliária de verdade, que é o pior tipo de erro possível aqui.
  //
  // Para carregá-los no ambiente de desenvolvimento:
  //     SEED_DEMO=1 npm run db:seed
  const carregarDemo = process.env.SEED_DEMO === "1";

  if (!carregarDemo) {
    console.log(
      "\nCatálogo intacto: nenhum imóvel de demonstração foi criado." +
        "\n(Para carregar os exemplos em desenvolvimento: SEED_DEMO=1 npm run db:seed)"
    );
    console.log("\nSeed concluído com sucesso.");
    return;
  }

  const imoveis = [
    {
      codigo: "BZ-0001",
      slug: "casa-terrea-3-quartos-jardim-europa",
      titulo: "Casa térrea de 3 quartos no Jardim Europa",
      descricao:
        "Casa térrea impecável em rua tranquila do Jardim Europa. São 3 quartos (1 suíte), sala ampla com pé-direito alto, cozinha planejada, área gourmet com churrasqueira e quintal com espaço para jardim. Garagem coberta para 2 carros. Documentação em dia, pronta para morar.\n\nAgende uma visita pelo WhatsApp — teremos prazer em apresentar cada detalhe pessoalmente.",
      tipo: TipoImovel.RESIDENCIAL,
      subtipo: SubtipoImovel.CASA,
      transacao: Transacao.VENDA,
      destaque: true,
      cidade: "Sorocaba",
      bairro: "Jardim Europa",
      quartos: 3,
      suites: 1,
      banheiros: 2,
      vagas: 2,
      areaM2: 180,
      areaTerrenoM2: 300,
      condominioMensal: null,
      iptuAnual: "1900",
      comodidades: ["churrasqueira", "area-gourmet", "quintal", "lavanderia"],
      precoVenda: "750000",
      precoLocacao: null,
      fotos: [
        { url: "https://picsum.photos/seed/bz-casa-1/1280/960", capa: true },
        { url: "https://picsum.photos/seed/bz-casa-2/1280/960", capa: false },
        { url: "https://picsum.photos/seed/bz-casa-3/1280/960", capa: false },
      ],
    },
    {
      codigo: "BZ-0002",
      slug: "sala-comercial-centro-40m2",
      titulo: "Sala comercial de 40 m² no Centro",
      descricao:
        "Sala comercial em edifício com portaria, elevador e localização estratégica no Centro de Sorocaba. Ideal para escritórios, consultórios e prestadores de serviço. Banheiro privativo, boa iluminação natural e fácil acesso a transporte público.\n\nDisponível para locação imediata. Fale conosco pelo WhatsApp para agendar uma visita.",
      tipo: TipoImovel.COMERCIAL,
      subtipo: SubtipoImovel.SALA_COMERCIAL,
      transacao: Transacao.LOCACAO,
      destaque: true,
      cidade: "Sorocaba",
      bairro: "Centro",
      quartos: null,
      suites: null,
      banheiros: 1,
      vagas: 1,
      areaM2: 40,
      areaTerrenoM2: null,
      condominioMensal: "380",
      iptuAnual: null,
      comodidades: ["portaria-24h", "elevador", "ar-condicionado"],
      precoVenda: null,
      precoLocacao: "2200",
      fotos: [
        { url: "https://picsum.photos/seed/bz-sala-1/1280/960", capa: true },
        { url: "https://picsum.photos/seed/bz-sala-2/1280/960", capa: false },
      ],
    },
    {
      codigo: "BZ-0003",
      slug: "apartamento-2-quartos-campolim",
      titulo: "Apartamento de 2 quartos no Campolim",
      descricao:
        "Apartamento moderno no Parque Campolim, uma das regiões mais valorizadas de Sorocaba. São 2 quartos (1 suíte), varanda gourmet, sala integrada e cozinha americana. Condomínio com piscina, academia e salão de festas. Disponível para venda ou locação.\n\nConsulte condições pelo WhatsApp — respondemos rápido!",
      tipo: TipoImovel.RESIDENCIAL,
      subtipo: SubtipoImovel.APARTAMENTO,
      transacao: Transacao.VENDA_LOCACAO,
      destaque: true,
      cidade: "Sorocaba",
      bairro: "Parque Campolim",
      quartos: 2,
      suites: 1,
      banheiros: 2,
      vagas: 1,
      areaM2: 68,
      areaTerrenoM2: null,
      condominioMensal: "780",
      iptuAnual: "1400",
      comodidades: [
        "piscina",
        "academia",
        "salao-festas",
        "portaria-24h",
        "elevador",
        "varanda",
      ],
      precoVenda: "520000",
      precoLocacao: "2800",
      fotos: [
        { url: "https://picsum.photos/seed/bz-apto-1/1280/960", capa: true },
        { url: "https://picsum.photos/seed/bz-apto-2/1280/960", capa: false },
        { url: "https://picsum.photos/seed/bz-apto-3/1280/960", capa: false },
      ],
    },
  ];

  for (const { fotos, ...dados } of imoveis) {
    const property = await prisma.property.upsert({
      where: { codigo: dados.codigo },
      // Rodar o seed de novo atualiza os campos de exibição dos exemplos
      // (preços e a ficha profissional) sem duplicar nem mexer nas fotos
      update: {
        precoVenda: dados.precoVenda,
        precoLocacao: dados.precoLocacao,
        subtipo: dados.subtipo ?? null,
        suites: dados.suites ?? null,
        areaTerrenoM2: dados.areaTerrenoM2 ?? null,
        condominioMensal: dados.condominioMensal ?? null,
        iptuAnual: dados.iptuAnual ?? null,
        comodidades: dados.comodidades ?? [],
      },
      create: dados,
    });

    const fotosExistentes = await prisma.propertyPhoto.count({
      where: { propertyId: property.id },
    });

    if (fotosExistentes === 0) {
      await prisma.propertyPhoto.createMany({
        data: fotos.map((foto, ordem) => ({
          propertyId: property.id,
          url: foto.url,
          storageKey: `seed/${dados.codigo}-${ordem}`,
          ordem,
          capa: foto.capa,
        })),
      });
    }
    console.log(`✔ Imóvel: ${dados.codigo} — ${dados.titulo}`);
  }

  console.log("\nSeed concluído com sucesso.");
}

main()
  .catch((e) => {
    // Banco fora do ar é DE LONGE o erro mais comum aqui, e o que o
    // Prisma cospe é um stack trace com o código P1001 no meio. Quem
    // está só tentando popular o banco não tem por que decifrar isso.
    const semBanco =
      e?.errorCode === "P1001" ||
      /Can't reach database server/i.test(String(e?.message ?? ""));

    if (semBanco) {
      console.error(
        [
          "",
          "✖ O banco não respondeu.",
          "",
          "  Suba o Postgres local numa outra janela e deixe rodando:",
          "      npm run db:local",
          "",
          "  Se ele disser que a porta está ocupada, sobrou um postgres",
          "  morto de uma sessão anterior:",
          "      Get-Process postgres* | Stop-Process -Force",
          "",
        ].join("\n")
      );
      process.exit(1);
    }

    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
