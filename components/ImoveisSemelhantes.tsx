import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import type { PublicPropertyDTO } from "@/lib/dto";

/**
 * "Imóveis parecidos" no rodapé do detalhe. A lista já vem pronta e
 * ranqueada do servidor (lib/semelhantes.ts) — este componente só exibe.
 */
export default function ImoveisSemelhantes({
  imoveis,
}: {
  imoveis: PublicPropertyDTO[];
}) {
  if (imoveis.length === 0) return null;

  return (
    <section
      aria-labelledby="semelhantes-titulo"
      className="border-t border-black/10 pt-12"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[13px] text-black/55">
            <span className="bz-dot" aria-hidden="true" />
            Talvez você goste
          </p>
          <h2
            id="semelhantes-titulo"
            className="text-2xl tracking-tight md:text-3xl"
          >
            Imóveis parecidos
          </h2>
        </div>
        <Link
          href="/imoveis"
          className="inline-flex items-center gap-1.5 rounded-pill border border-black/35 px-5 py-2.5 text-[13px] font-medium transition-colors hover:border-black"
        >
          Ver catálogo completo
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {imoveis.map((imovel) => (
          <PropertyCard key={imovel.id} imovel={imovel} />
        ))}
      </div>
    </section>
  );
}
