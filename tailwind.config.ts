import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        /**
         * A TINTA DO SITE É O MARINHO DO LOGOTIPO, não preto puro.
         *
         * Sobrescrever `black` troca a identidade do site inteiro de uma
         * vez: as centenas de `text-black`, `bg-black` e `border-black/10`
         * espalhadas pelos componentes passam a usar o marinho, sem
         * precisar editar arquivo por arquivo (e sem risco de esquecer
         * um). Sombras continuam em preto puro porque são rgba() literais.
         *
         * Contraste: #14264A sobre branco dá 13:1 — melhor que a maioria
         * dos cinzas e bem acima do mínimo WCAG.
         */
        black: "#14264A",
        /** Preto de verdade, para quando for mesmo necessário. */
        "preto-puro": "#000000",

        ink: "#14264A",
        "ink-soft": "#1E3A6B",
        paper: "#ffffff",
        mist: "#F3F4F7",

        /**
         * Superfície da página. O catálogo era branco sobre branco: o card
         * só se separava do fundo por sombra, que é um recurso mais fraco
         * que contraste de superfície. Com o fundo levemente azulado e o
         * card branco puro, a separação vem da própria cor — e o azulado
         * ainda puxa o marinho por vizinhança.
         */
        fundo: "#F5F7FA",

        /**
         * Escala do marinho. Antes existia um valor só, e toda hierarquia
         * era feita com opacidade sobre branco — funciona, mas achata.
         * fundo (superfície grande) → tinta → claro (hover/interativo) →
         * linha (bordas e ícones sobre claro).
         */
        "marinho-fundo": "#0D1B36",
        marinho: "#14264A",
        "marinho-claro": "#1E3A6B",
        "marinho-linha": "#2B4C7E",
        /**
         * Dourado do logotipo — DECORATIVO. Sobre branco dá só 2,4:1,
         * muito abaixo do mínimo WCAG de 4,5:1. Use em filete, detalhe de
         * ícone e texto sobre o marinho. Nunca em texto pequeno no claro.
         */
        dourado: "#C6A052",
        "dourado-claro": "#E0C27E",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      borderRadius: {
        pill: "999px",
      },
    },
  },
  plugins: [],
};

export default config;
