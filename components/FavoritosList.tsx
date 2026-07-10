"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import type { PublicPropertyDTO } from "@/lib/dto";
import { lerFavoritos, EVENTO_FAVORITOS } from "@/lib/favoritos";

type Estado = "carregando" | "pronto" | "erro";

/**
 * Lista de favoritos: lê os ids do localStorage e busca os imóveis na API
 * pública. Imóveis pausados/vendidos somem sozinhos (a API só devolve ATIVOS).
 */
export default function FavoritosList() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [imoveis, setImoveis] = useState<PublicPropertyDTO[]>([]);

  const carregar = useCallback(async () => {
    const ids = lerFavoritos();
    if (ids.length === 0) {
      setImoveis([]);
      setEstado("pronto");
      return;
    }
    try {
      const res = await fetch(
        `/api/properties?ids=${encodeURIComponent(ids.join(","))}`
      );
      if (!res.ok) throw new Error();
      const body = (await res.json()) as { properties: PublicPropertyDTO[] };
      // Mantém a ordem em que o visitante favoritou
      const porId = new Map(body.properties.map((p) => [p.id, p]));
      setImoveis(
        ids
          .map((id) => porId.get(id))
          .filter((p): p is PublicPropertyDTO => Boolean(p))
      );
      setEstado("pronto");
    } catch {
      setEstado("erro");
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Desfavoritar direto na lista remove o card sem precisar de reload
  useEffect(() => {
    function aoMudar() {
      const ids = new Set(lerFavoritos());
      setImoveis((atual) => atual.filter((p) => ids.has(p.id)));
    }
    window.addEventListener(EVENTO_FAVORITOS, aoMudar);
    return () => window.removeEventListener(EVENTO_FAVORITOS, aoMudar);
  }, []);

  if (estado === "carregando") {
    return (
      <div
        className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3"
        aria-label="Carregando favoritos"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-mist" />
            <div className="h-5 w-2/3 animate-pulse rounded-full bg-mist" />
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-mist" />
          </div>
        ))}
      </div>
    );
  }

  if (estado === "erro") {
    return (
      <div className="rounded-2xl bg-mist px-6 py-16 text-center">
        <p className="text-sm text-black/55">
          Não foi possível carregar seus favoritos agora. Recarregue a página
          para tentar de novo.
        </p>
      </div>
    );
  }

  if (imoveis.length === 0) {
    return (
      <div className="bz-fade-up flex flex-col items-center gap-5 rounded-2xl bg-mist px-6 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black/40">
          <Heart size={24} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <div>
          <h2 className="mb-2 text-2xl tracking-tight">
            Nenhum favorito ainda.
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-black/55">
            Toque no coração de qualquer imóvel para guardá-lo aqui — a lista
            fica salva neste dispositivo, sem precisar de cadastro.
          </p>
        </div>
        <Link
          href="/imoveis"
          className="inline-flex items-center gap-2 rounded-pill bg-black px-6 py-3 text-[13px] font-medium text-white transition-transform duration-200 ease-premium hover:-translate-y-0.5"
        >
          Explorar o catálogo
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mb-8 text-[13px] text-black/45">
        {imoveis.length} imóve{imoveis.length === 1 ? "l" : "is"} salvo
        {imoveis.length === 1 ? "" : "s"} neste dispositivo
      </p>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {imoveis.map((imovel, i) => (
          <PropertyCard key={imovel.id} imovel={imovel} prioridade={i < 3} />
        ))}
      </div>
    </>
  );
}
