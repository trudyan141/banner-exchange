import react from "@vitejs/plugin-react";
import sass from 'sass';
import { defineConfig } from "vite";
import { libInjectCss } from 'vite-plugin-lib-inject-css';
const VERSION = "0.0.1";
export default defineConfig({
  define: {
    "process.env": {
      NODE_ENV: "production",
    },
  },
  plugins: [react(), libInjectCss()],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly', // Ensure consistent naming convention
    },
    preprocessorOptions: {
      scss: {
        implementation: sass,
      },
    },
  },
  // 👇 Insert these lines
  build: {
    lib: {
      entry: "./src/index.tsx",
      name: "bannerExchangeCode",
      fileName: (format) => `${VERSION}/bec.js`,  // Using the VERSION constant
    },
    target: "esnext",
  },
});