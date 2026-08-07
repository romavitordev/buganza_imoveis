"use client";

import { useEffect, useRef } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Quanto o atributo `data-trocando` fica no <html>.
 *
 * Tem que ser MAIOR que a mais longa das duas animações do CSS (ver
 * globals.css): o astro leva 1,05s e as cores 1,15s. Se sair antes, a
 * transição de cor é cortada no meio e a tela dá um salto — que é
 * exatamente o piscar que se está tentando evitar.
 */
const DURACAO_MS = 1200;

/**
 * Botão de modo claro/escuro.
 *
 * NÃO guarda estado no React. O tema mora no atributo `data-theme` do
 * <html>, escrito antes da primeira pintura pelo script do layout — se
 * este componente tivesse um `useState` com o tema, o HTML do servidor
 * (que não sabe a preferência de ninguém) discordaria do DOM e a troca
 * só aconteceria depois da hidratação, piscando.
 *
 * Pelo mesmo motivo os dois ícones são renderizados sempre, e quem
 * decide qual aparece é o CSS (.bz-icone-lua / .bz-icone-sol).
 * Mostramos o ícone do modo PARA ONDE se vai, não o do modo atual:
 * lua no claro, sol no escuro.
 *
 * A troca marca `data-trocando` no <html> pela duração da coreografia.
 * É esse atributo que liga, só durante a transição, o amaciamento das
 * cores e o nascer/pôr do corpo celeste da cena do hero.
 */
export default function ThemeToggle() {
  const timerRef = useRef<number>();

  // Se o componente sair da tela no meio da troca, o atributo ficaria
  // grudado no <html> e toda a página seguiria com transição de cor.
  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current);
      delete document.documentElement.dataset.trocando;
    };
  }, []);

  function alternar() {
    const raiz = document.documentElement;
    const novo = raiz.dataset.theme === "dark" ? "light" : "dark";
    raiz.dataset.theme = novo;

    try {
      localStorage.setItem("bz-tema", novo);
    } catch {
      // Navegação privada pode recusar o localStorage — o tema vale
      // para esta página e o site segue funcionando.
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    window.clearTimeout(timerRef.current);
    // Tirar e repor no mesmo quadro não reinicia animação nenhuma: o
    // navegador agrupa as duas mudanças. O reflow forçado no meio é o
    // que faz o clique rápido recomeçar a coreografia em vez de ignorá-la.
    delete raiz.dataset.trocando;
    void raiz.offsetWidth;
    raiz.dataset.trocando = "1";

    timerRef.current = window.setTimeout(() => {
      delete raiz.dataset.trocando;
    }, DURACAO_MS);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Alternar entre modo claro e escuro"
      title="Alternar entre modo claro e escuro"
      /* Ícone "fantasma", sem o disco marinho: na navbar só o WhatsApp
         tem disco preenchido, porque é a ação principal. Ver o
         comentário da hierarquia em SiteNav. */
      className="bz-icon-btn"
    >
      <Moon
        size={19}
        strokeWidth={1.9}
        aria-hidden="true"
        className="bz-icone-lua"
      />
      <Sun
        size={19}
        strokeWidth={1.9}
        aria-hidden="true"
        className="bz-icone-sol"
      />
    </button>
  );
}
