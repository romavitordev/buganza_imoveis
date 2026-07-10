import Link from "next/link";
import Hero from "@/components/Hero";
import PropertyCard from "@/components/PropertyCard";
import ComoFunciona from "@/components/ComoFunciona";
import QuemSomos from "@/components/QuemSomos";
import Faq from "@/components/Faq";
import AnuncieBanner from "@/components/AnuncieBanner";
import SiteFooter from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { toPublicPropertyDTOList } from "@/lib/dto";

// ISR: home servida do cache; admin invalida na hora via revalidatePath
export const revalidate = 300;

export default async function HomePage() {
  const destaques = await prisma.property
    .findMany({
      where: { destaque: true, status: "ATIVO" },
      include: { fotos: { orderBy: { ordem: "asc" } } },
      orderBy: { atualizadoEm: "desc" },
      take: 6,
    })
    .then(toPublicPropertyDTOList)
    .catch(() => []);

  return (
    <main>
      <Hero />

      {destaques.length > 0 && (
        <section
          id="destaques"
          className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24"
          aria-labelledby="destaques-titulo"
        >
          <div className="bz-fade-up mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-[13px] text-black/55">
                <span className="bz-dot" aria-hidden="true" />
                Selecionados para você
              </p>
              <h2
                id="destaques-titulo"
                className="text-3xl tracking-tight md:text-4xl"
              >
                Em destaque
              </h2>
            </div>
            <Link
              href="/imoveis"
              className="rounded-pill border border-black/35 px-5 py-2.5 text-[13px] font-medium transition-colors hover:border-black"
            >
              Ver todos os imóveis
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {destaques.map((imovel, i) => (
              <PropertyCard key={imovel.id} imovel={imovel} prioridade={i < 3} />
            ))}
          </div>
        </section>
      )}

      <ComoFunciona />

      <QuemSomos />

      <Faq />

      <AnuncieBanner />

      <SiteFooter />
    </main>
  );
}
