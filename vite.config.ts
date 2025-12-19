
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to resolve 'cwd' property error in environments with limited Node.js type definitions
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || '')
    },
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      target: 'esnext'
    }
  };
});
