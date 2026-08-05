"use client";

import { Moon, Sun } from "lucide-react";

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
 */
export default function ThemeToggle() {
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
  }

  return (
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
  );
}
