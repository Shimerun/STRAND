import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import siteMeta from './vite/siteMeta.js';

export default defineConfig({
  plugins: [react(), siteMeta()],
});
