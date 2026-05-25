import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    federation({
      name: 'alertCenter',
      filename: 'remoteEntry.js',
      exposes: {
        './AlertCenterPage': './src/AlertCenterPage.tsx',
      },
      shared: ['react', 'react-dom', '@tanstack/react-query'],
    }),
  ],
  server: {
    port: 5177,
  },
  preview: {
    port: 5177,
  },
  build: {
    target: 'esnext',
  },
});
