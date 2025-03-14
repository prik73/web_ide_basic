import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'ace-builds': path.resolve(__dirname, 'node_modules/ace-builds'),
    },
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..', 'node_modules']
    }
  }
});