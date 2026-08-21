import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Dev server port (different from production which runs inside Electron)
    port: 5173,
    proxy: {
      // Proxy API and WebSocket to the Electron server during development
      "/api": {
        target: "http://localhost:3847",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:3847",
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined, // Keep single chunk for mobile
      },
    },
  },
  // PWA-related settings
  define: {
    __APP_VERSION__: JSON.stringify("0.1.0"),
  },
});
