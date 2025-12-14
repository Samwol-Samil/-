import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for assets to work on any GitHub Pages repo
  define: {
    // Polyfill process.env for the Google GenAI SDK usage in the code
    'process.env': {}
  },
  build: {
    outDir: 'dist',
  }
});