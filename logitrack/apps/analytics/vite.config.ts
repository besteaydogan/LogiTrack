import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    federation({
      name: 'analytics',
      filename: 'remoteEntry.js',
      exposes: {
        './AnalyticsPage': './src/AnalyticsPage.tsx',
      },
      shared: ['react', 'react-dom', '@tanstack/react-query'],
    }),
  ],
  server: {
    port: 5174,
  },
  preview: {
    port: 5174,
  },
  build: {
    target: 'esnext',
  },
});
