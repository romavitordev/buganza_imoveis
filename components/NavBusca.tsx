"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

/**
 * Busca da navbar — só na home, só no desktop.
 *
 * POR QUE SÓ NA HOME: no catálogo já existe um campo de busca dentro da
 * barra de filtros. Dois campos de busca na mesma tela, um deles sem os
 * filtros do lado, é o tipo de duplicidade que faz o visitante escolher
 * errado. Aqui ele resolve o problema oposto: quem abre o site sabendo o
 * que quer ("Campolim", "BZ-0003") tinha que ir ao catálogo primeiro e
 * só então procurar.
 *
 * POR QUE SÓ NO DESKTOP: no mobile a navbar é um logo e um botão, e a
 * navegação mora na barra de baixo. Um campo de texto ali comeria a
 * primeira dobra inteira, que é onde o título e os CTAs precisam estar.
 *
 * É um <form> de verdade, com method GET para /imoveis: funciona antes
 * de o JavaScript carregar e o Enter faz o que se espera.
 */
export default function NavBusca() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [valor, setValor] = useState("");
  const [focado, setFocado] = useState(false);

  /**
   * "/" foca a busca, como em qualquer site de conteúdo. Escape devolve
   * o foco para a página.
   *
   * A checagem de onde o foco está é obrigatória: sem ela, digitar "/"
   * dentro de qualquer outro campo — ou no chat do suporte — roubaria o
   * cursor no meio da frase.
   */
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      const digitando =
        alvo instanceof HTMLInputElement ||
        alvo instanceof HTMLTextAreaElement ||
        alvo instanceof HTMLSelectElement ||
        alvo?.isContentEditable;

      if (e.key === "/" && !digitando && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const termo = valor.trim();
    // Sem termo, vai para o catálogo inteiro: é o que a pessoa quer ao
    // apertar Enter num campo vazio, e é melhor que não fazer nada.
    router.push(termo ? `/imoveis?q=${encodeURIComponent(termo)}` : "/imoveis");
  }

  return (
    <form
      onSubmit={enviar}
      action="/imoveis"
      method="get"
      role="search"
      className="hidden lg:block"
    >
      <label htmlFor="busca-nav" className="sr-only">
        Buscar imóveis por bairro, código ou tipo
      </label>

      <div
        className={`flex items-center gap-2 rounded-pill border bg-white/85 pl-3.5 pr-1.5 backdrop-blur transition-all duration-300 ease-premium ${
          focado
            ? "w-[300px] border-black/15 shadow-[0_4px_20px_rgba(20,38,74,0.10)]"
            : "w-[228px] border-transparent shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
        }`}
      >
        <Search
          size={15}
          strokeWidth={2}
          aria-hidden="true"
          className={`shrink-0 transition-colors duration-300 ${
            focado ? "text-black" : "text-secundario"
          }`}
        />

        <input
          ref={inputRef}
          id="busca-nav"
          name="q"
          type="search"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          placeholder="Bairro, código ou tipo"
          /* appearance-none tira o "x" nativo do type=search no WebKit,
             que aparece fora do ritmo do resto e não segue o tema. */
          className="h-9 w-full appearance-none bg-transparent text-[13px] text-black outline-none placeholder:text-secundario [&::-webkit-search-cancel-button]:appearance-none"
        />

        {valor ? (
          <button
            type="button"
            onClick={() => {
              setValor("");
              inputRef.current?.focus();
            }}
            aria-label="Limpar busca"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-secundario transition-colors hover:bg-mist hover:text-black"
          >
            <X size={13} strokeWidth={2.5} aria-hidden="true" />
          </button>
        ) : (
          /* A dica da tecla só aparece com o campo vazio e sem foco:
             depois que a pessoa começou a digitar ela já sabe onde está,
             e o atalho vira ruído em cima do texto. */
          <kbd
            aria-hidden="true"
            className={`hidden shrink-0 rounded border border-black/10 px-1.5 py-0.5 font-sans text-[10px] text-secundario transition-opacity duration-300 xl:block ${
              focado ? "opacity-0" : "opacity-100"
            }`}
          >
            /
          </kbd>
        )}
      </div>
    </form>
  );
}
