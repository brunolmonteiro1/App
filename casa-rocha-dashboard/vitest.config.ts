import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Testes de unidade das regras críticas (BLUEPRINT v2 §40). Ambiente node;
// cobrimos funções puras/determinísticas (sem banco nem runtime do Next).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
