import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api/* calls to backend
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      // Proxy /r/* (redirect info, verify, preview confirm) to backend
      "/r": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
