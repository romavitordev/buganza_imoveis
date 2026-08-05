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
         * OS QUATRO TOKENS QUE VIRAM NO MODO ESCURO.
         *
         * São variáveis CSS (canais R G B soltos, para o Tailwind poder
         * aplicar opacidade: `text-black/70` vira rgb(var(--ink)/0.7)).
         * Os valores vivem em globals.css, sob :root e [data-theme="dark"].
         *
         * POR QUE ASSIM: as centenas de `text-black`, `bg-white` e
         * `border-black/10` espalhadas pelos componentes passam a virar
         * sozinhas quando o tema muda — sem `dark:` em arquivo nenhum, e
         * sem risco de esquecer um canto do site.
         *
         * `black` não é preto: é a TINTA (marinho do logotipo no claro,
         * quase-branco no escuro). `white` não é branco: é o PAPEL, a
         * superfície dos cards. É por isso que um botão `bg-black
         * text-white` se inverte sozinho no escuro e continua legível.
         * Sombras seguem em preto literal, que é rgba() cru.
         */
        black: "rgb(var(--ink) / <alpha-value>)",
        white: "rgb(var(--paper) / <alpha-value>)",
        /** Superfície da página, atrás dos cards. */
        fundo: "rgb(var(--fundo) / <alpha-value>)",
        /** Preenchimento sutil: esqueletos, avatares, chips. */
        mist: "rgb(var(--mist) / <alpha-value>)",
        /** Faixa escura de destaque ("Anuncie"). */
        "marinho-fundo": "rgb(var(--banda) / <alpha-value>)",

        /** Preto e branco de verdade, para quando for mesmo necessário. */
        "preto-puro": "#000000",
        "branco-puro": "#ffffff",

        /**
         * Cores fixas da marca — não viram com o tema, são o logotipo.
         * Use `black` quando quiser a tinta que acompanha o modo.
         */
        ink: "#14264A",
        "ink-soft": "#1E3A6B",
        paper: "#ffffff",
        marinho: "#14264A",
        "marinho-claro": "#1E3A6B",
        "marinho-linha": "#2B4C7E",
        /**
         * Dourado do logotipo. No CLARO é decorativo: sobre branco dá só
         * 2,4:1, muito abaixo do mínimo WCAG de 4,5:1 — filete, borda,
         * preenchimento, nunca texto. Sobre superfície escura (o modo
         * escuro, ou a faixa marinho) passa dos 7:1 e pode ser texto.
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
