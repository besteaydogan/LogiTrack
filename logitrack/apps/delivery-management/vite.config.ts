import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    federation({
      name: 'deliveryManagement',
      filename: 'remoteEntry.js',
      exposes: {
        './DeliveryManagementPage': './src/DeliveryManagementPage.tsx',
      },
      shared: ['react', 'react-dom', '@tanstack/react-query'],
    }),
  ],
  server: {
    port: 5176,
  },
  preview: {
    port: 5176,
  },
  build: {
    target: 'esnext',
  },
});
