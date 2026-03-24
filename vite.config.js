import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_APP_BASE_PATH || "/gridiron-gm/",
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
