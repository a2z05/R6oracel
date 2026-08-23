import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const oracleAliases: Record<string, string> = {
  "@oracle/domain": resolve(__dirname, "../../packages/domain/src"),
  "@oracle/shared": resolve(__dirname, "../../packages/shared/src"),
  "@oracle/db": resolve(__dirname, "../../packages/db/src"),
  "@oracle/ocr": resolve(__dirname, "../../packages/ocr/src"),
  "@oracle/overlay": resolve(__dirname, "../../packages/overlay/src"),
  "@oracle/providers": resolve(__dirname, "../../packages/providers/src"),
  "@oracle/ui-tokens": resolve(__dirname, "../../packages/ui-tokens/src"),
};

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.ts"),
        },
        // Keep native/CJS deps external (they break when bundled as ESM),
        // bundle everything else incl. @oracle/* workspace packages
        external: ["electron", "electron-updater", "sharp", "tesseract.js", "sql.js", "drizzle-orm"],
      },
    },
    resolve: {
      alias: oracleAliases,
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.ts"),
        },
      },
    },
  },
  renderer: {
    root: resolve(__dirname, "src/renderer"),
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index.html"),
        },
      },
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: oracleAliases,
    },
  },
});
