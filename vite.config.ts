import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    headers: {
      "Cache-Control": "no-cache",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname!, "./src"),
      "@assets": path.resolve(import.meta.dirname!, "./src/assets"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
