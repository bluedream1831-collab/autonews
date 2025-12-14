import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY. 
      // Use || '' to ensure it is always a string, preventing "process is not defined" errors in browser if key is missing.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
  };
});