import react from "@vitejs/plugin-react";
import dotenv from 'dotenv';
import { visualizer } from 'rollup-plugin-visualizer';
import sass from 'sass';
import { defineConfig } from "vite";
import { libInjectCss } from 'vite-plugin-lib-inject-css';
export default defineConfig(() => {
  dotenv.config();
  return {
    define: {
      "process.env": {
        VITE_APP_NODE_ENV: process.env.VITE_APP_NODE_ENV,
        VITE_APP_BACKEND_API_URL:process.env.VITE_APP_BACKEND_API_URL,
      },
    },
    plugins: [react(), libInjectCss(), 
      visualizer({
        filename: 'stats.html',
        //open: true, // Automatically opens the visualizer in your browser 
      })
    ],
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
      emptyOutDir: false,
      lib: {
        entry: "./src/index.js",
        name: "bannerExchangeCode",
        fileName: (format) => `bec.js`
      },
      target: "esnext",
      rollupOptions: {
        // Externalize React and ReactDOM
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      },
        // Enable Terser minification with custom options
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.VITE_APP_NODE_ENV === 'production' ? true : false, // Remove console.logs
          drop_debugger: true, // Remove debugger statements
          passes: 3, // Increase the number of passes to compress more
          dead_code: true, // Remove unreachable code
          pure_funcs: ['console.info', 'console.debug', 'console.warn'], // Remove specific function calls
          unused: true, // Drop unreferenced functions and variables
          reduce_funcs: true, // Inline single-use functions
          reduce_vars: true, // Collapse single-use variables
        },
        format: {
          comments: false, // Remove comments
        },
      },
    },
  }
});