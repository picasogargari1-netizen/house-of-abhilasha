import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://oxvkxbygniwgcahmmeea.supabase.co";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    headers: {
      "Cache-Control": "no-cache",
    },
    proxy: {
      "/supabase-proxy": {
        target: supabaseUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase-proxy/, ""),
        secure: true,
      },
      "/supabase-storage": {
        target: supabaseUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase-storage/, "/storage"),
        secure: true,
      },
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
