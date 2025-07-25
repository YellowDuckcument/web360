import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

export default defineConfig({
  base: "/KTX/",  // ⚠️ frontend sẽ chạy dưới path này
  plugins: [
    react(),
    cesium()
  ],

  server: {
    host: true, 
    allowedHosts: ["model.3dscan.vn"], 
    port: 3004,
  },

  define: {
    CESIUM_BASE_URL: JSON.stringify("/Cesium")
  },
});
