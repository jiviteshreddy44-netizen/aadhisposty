import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: Cast process to any to bypass TypeScript error for missing cwd property on certain Process types
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Robustly capture the API key from multiple possible sources (Vercel env, local .env, etc.)
  const API_KEY = env.API_KEY || env.VITE_API_KEY || process.env.API_KEY || process.env.VITE_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Injects the API key into the browser bundle
      'process.env.API_KEY': JSON.stringify(API_KEY)
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