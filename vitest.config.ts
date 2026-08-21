import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/dist-*/**"],
    pool: "forks",
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
