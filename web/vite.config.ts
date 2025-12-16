import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { skybridge } from "skybridge/web";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [skybridge(), react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // Output widget entry points without hash in filename for predictable URLs
    rollupOptions: {
      output: {
        // Entry files (widgets) get clean names without hash
        entryFileNames: "[name].js",
        // Shared chunks go to assets/ with hash for cache busting
        chunkFileNames: "assets/[name]-[hash].js",
        // CSS gets clean name
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "style.css";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
