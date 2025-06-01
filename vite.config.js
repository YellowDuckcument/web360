import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), cesium()],
  server: {
    port: 3000,
  },

  define: {
    CESIUM_BASE_URL: JSON.stringify("/node_modules/cesium/Build/Cesium"),
  },
});
