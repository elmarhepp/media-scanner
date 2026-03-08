import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  preview: {
    // Railway healthchecks use platform hostnames, so preview must accept them.
    allowedHosts: true,
  },
});
