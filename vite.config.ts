// @ts-nocheck
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables from the current directory.
  // The third argument '' allows loading all variables regardless of prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Prioritize API_KEY or VITE_API_KEY from the environment.
  const API_KEY = env.API_KEY || env.VITE_API_KEY || process.env.API_KEY || process.env.VITE_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Vite replaces this string with the actual API key value during build.
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
