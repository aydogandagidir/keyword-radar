import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  esbuild: {
    charset: "ascii"
  },
  plugins: [
    react(),
    {
      name: "copy-extension-manifest",
      closeBundle() {
        mkdirSync(resolve(__dirname, "dist"), { recursive: true });
        copyFileSync(resolve(__dirname, "manifest.json"), resolve(__dirname, "dist/manifest.json"));
        mkdirSync(resolve(__dirname, "dist/assets/fonts"), { recursive: true });
        copyFileSync(
          resolve(__dirname, "src/assets/fonts/bluedev-geist-latin-ext.woff2"),
          resolve(__dirname, "dist/assets/fonts/bluedev-geist-latin-ext.woff2")
        );
        mkdirSync(resolve(__dirname, "dist/assets/icons"), { recursive: true });
        for (const size of [16, 32, 48, 128]) {
          copyFileSync(
            resolve(__dirname, `src/assets/icons/icon-${size}.png`),
            resolve(__dirname, `dist/assets/icons/icon-${size}.png`)
          );
        }
      }
    }
  ],
  build: {
    emptyOutDir: true,
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/service-worker.ts"),
        content: resolve(__dirname, "src/content/index.tsx"),
        trendyolBridge: resolve(__dirname, "src/content/trendyol-page-bridge.ts"),
        xlsx: resolve(__dirname, "src/export/xlsx-entry.ts")
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});
