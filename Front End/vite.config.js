import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { localBackendBridge } from "./server/local-backend.js";
export default defineConfig({
  plugins: [react(), localBackendBridge()],
  server: {
    port: 5178,
    strictPort: true,
    proxy: {
      "/api/v1": { target: "http://127.0.0.1:8766", changeOrigin: false },
    },
  },
});
