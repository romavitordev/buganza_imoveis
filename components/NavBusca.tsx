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
 * DUAS VARIANTES, uma por tamanho de tela:
 *
 *  - "navbar" (desktop): pílula compacta ao lado dos links, ocupando o
 *    vazio que sobrava entre o logo e as ações num monitor largo.
 *
 *  - "mobile": barra de largura inteira logo abaixo da navbar, na faixa
 *    de céu vazio do hero. Ali ela não disputa espaço com nada — o
 *    título e os CTAs ficam ancorados embaixo — e está visível assim que
 *    a pessoa abre o site, sem precisar tocar em nada para revelar.
 *
 * Eu tinha deixado o mobile de fora com o argumento de que um campo de
 * texto comeria a primeira dobra. Estava errado: o campo não precisava
 * ficar JUNTO do título, e a maior parte do tráfego de imobiliária vem
 * do celular — era justamente lá que a busca mais fazia falta.
 *
 * É um <form> de verdade, com method GET para /imoveis: funciona antes
 * de o JavaScript carregar e o Enter faz o que se espera.
 */
export default function NavBusca({
  variante = "navbar",
  autoFoco = false,
}: {
  variante?: "navbar" | "mobile";
  /** Abre já com o teclado — quem tocou na lupa quer digitar. */
  autoFoco?: boolean;
}) {
  const ehMobile = variante === "mobile";
  const campoId = ehMobile ? "busca-mobile" : "busca-nav";
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
  // Foco ao montar: a busca do mobile só existe depois do toque na
  // lupa, então quem chegou aqui quer digitar. Um passo a menos.
  useEffect(() => {
    if (autoFoco) inputRef.current?.focus();
  }, [autoFoco]);

  useEffect(() => {
    // Só a variante do desktop escuta. As duas coexistem no DOM (o CSS
    // é que esconde uma), então sem esta guarda o atalho seria
    // registrado duas vezes e o Escape brigaria consigo mesmo.
    if (ehMobile) return;

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
  }, [ehMobile]);

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
      className={ehMobile ? "min-w-0 flex-1 xl:hidden" : "hidden xl:block"}
    >
      <label htmlFor={campoId} className="sr-only">
        Buscar imóveis por bairro, código ou tipo
      </label>

      <div
        className={`flex items-center gap-2 rounded-pill border bg-white/85 pl-3.5 pr-1.5 backdrop-blur transition-all duration-300 ease-premium ${
          ehMobile
            ? /* Largura inteira: no celular não há espaço lateral para
                 ganhar, e campo estreito com dedo grande é fonte de erro
                 de toque. A sombra é mais marcada porque aqui ele flutua
                 sobre a cena, e não sobre superfície branca. */
              `w-full ${
                focado
                  ? "border-black/15 shadow-[0_6px_24px_rgba(20,38,74,0.14)]"
                  : "border-black/8 shadow-[0_3px_18px_rgba(20,38,74,0.10)]"
              }`
            : focado
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
          id={campoId}
          name="q"
          type="search"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          placeholder="Bairro, código ou tipo"
          /* appearance-none tira o "x" nativo do type=search no WebKit,
             que aparece fora do ritmo do resto e não segue o tema. */
          className={`w-full appearance-none bg-transparent text-black outline-none placeholder:text-secundario [&::-webkit-search-cancel-button]:appearance-none ${
            /* 44px é o alvo de toque mínimo confortável; 16px de fonte
               impede o iOS de dar zoom no campo ao focar, que é o
               comportamento padrão dele abaixo disso e joga o layout
               todo para o lado. */
            ehMobile ? "h-11 text-[16px]" : "h-9 text-[13px]"
          }`}
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
          !ehMobile && (
          <kbd
            aria-hidden="true"
            className={`hidden shrink-0 rounded border border-black/10 px-1.5 py-0.5 font-sans text-[10px] text-secundario transition-opacity duration-300 xl:block ${
              focado ? "opacity-0" : "opacity-100"
            }`}
          >
            /
          </kbd>
          )
        )}
      </div>
    </form>
  );
}
