import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  ...(command === "serve"
    ? {
        server: {
          proxy: {
            "/api": {
              target: "https://dualgate.duckdns.org",
              changeOrigin: true,
              secure: true,
            },
          },
        },
      }
    : {}),
}));
