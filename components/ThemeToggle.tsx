"use client";

import { useEffect, useRef } from "react";
import { Moon, Sun } from "lucide-react";

/** Quanto dura a coreografia da troca (igual ao CSS, em globals.css). */
const DURACAO_MS = 950;

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
 * A troca marca `data-trocando` no <html> por ~1s. É esse atributo que
 * liga, só durante a transição, a varredura dourada, o amaciamento das
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
    <>
      <button
        type="button"
        onClick={alternar}
        aria-label="Alternar entre modo claro e escuro"
        title="Alternar entre modo claro e escuro"
        className="bz-contact-pill"
      >
        <span className="bz-contact-circle">
          <Moon
            size={14}
            strokeWidth={2.5}
            aria-hidden="true"
            className="bz-icone-lua"
          />
          <Sun
            size={14}
            strokeWidth={2.5}
            aria-hidden="true"
            className="bz-icone-sol"
          />
        </span>
      </button>

      {/* A faixa que atravessa a tela na troca. Fica sempre no DOM,
          parada e invisível — só o CSS a põe para correr. */}
      <span className="bz-varredura" aria-hidden="true" />
    </>
  );
}
