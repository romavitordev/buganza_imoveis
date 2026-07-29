import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Mesmo alias "@/..." do tsconfig
      "@": path.resolve(__dirname),
      // `server-only` é a trava que impede módulos de servidor (e segredos
      // como o AUTH_SECRET) de irem parar no bundle do cliente. Fora do
      // Next ele lança de propósito, então nos testes vira um módulo
      // vazio — a trava continua valendo no build de verdade.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
