import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import siteMeta from './vite/siteMeta.js';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/STRAND/' : '/',
  plugins: [react(), siteMeta()],
});
