import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, 'src');

/** Must match DSA-Visualizer `launchSettings.json` HTTP URL (avoid `localhost` → IPv6 issues on Windows). */
const apiDevTarget = 'http://127.0.0.1:5258';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [{ find: /^@\//, replacement: `${srcDir}/` }],
  },
  server: {
    proxy: {
      '/api': {
        target: apiDevTarget,
        changeOrigin: true,
      },
      '/hubs': {
        target: apiDevTarget,
        ws: true,
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: apiDevTarget,
        changeOrigin: true,
      },
      '/hubs': {
        target: apiDevTarget,
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
