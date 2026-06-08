import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts", "apps/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"]
    }
  },
  resolve: {
    alias: {
      "@bluedev/shared-types": fromRoot("./packages/shared-types/src/index.ts"),
      "@bluedev/core": fromRoot("./packages/core/src/index.ts"),
      "@bluedev/adapters": fromRoot("./packages/adapters/src/index.ts"),
      "@bluedev/export": fromRoot("./packages/export/src/index.ts"),
      "@bluedev/scoring": fromRoot("./packages/scoring/src/index.ts"),
      "@bluedev/config": fromRoot("./packages/config/src/index.ts")
    }
  }
});
