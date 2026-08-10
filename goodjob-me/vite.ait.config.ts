import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: path.resolve(rootDir, "ait"),
  base: "./",
  publicDir: path.resolve(rootDir, "public"),
  plugins: [react()],
  build: {
    outDir: path.resolve(rootDir, "ait-dist"),
    emptyOutDir: true,
  },
});
