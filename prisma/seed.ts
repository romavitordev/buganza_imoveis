import { PrismaClient, TipoImovel, Transacao } from "@prisma/client";
import bcrypt from "bcryptjs";

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

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      nome: "Buganza Imóveis",
      email,
      passwordHash,
    },
  });
  console.log(`✔ Admin criado/atualizado: ${email}`);

  // ---------- Imóveis de exemplo ----------
  const imoveis = [
    {
      codigo: "BZ-0001",
      slug: "casa-terrea-3-quartos-jardim-europa",
      titulo: "Casa térrea de 3 quartos no Jardim Europa",
      descricao:
        "Casa térrea impecável em rua tranquila do Jardim Europa. São 3 quartos (1 suíte), sala ampla com pé-direito alto, cozinha planejada, área gourmet com churrasqueira e quintal com espaço para jardim. Garagem coberta para 2 carros. Documentação em dia, pronta para morar.\n\nAgende uma visita pelo WhatsApp — teremos prazer em apresentar cada detalhe pessoalmente.",
      tipo: TipoImovel.RESIDENCIAL,
      transacao: Transacao.VENDA,
      destaque: true,
      cidade: "Sorocaba",
      bairro: "Jardim Europa",
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      areaM2: 180,
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
      transacao: Transacao.LOCACAO,
      destaque: true,
      cidade: "Sorocaba",
      bairro: "Centro",
      quartos: null,
      banheiros: 1,
      vagas: 1,
      areaM2: 40,
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
      transacao: Transacao.VENDA_LOCACAO,
      destaque: true,
      cidade: "Sorocaba",
      bairro: "Parque Campolim",
      quartos: 2,
      banheiros: 2,
      vagas: 1,
      areaM2: 68,
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
      update: {},
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
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
