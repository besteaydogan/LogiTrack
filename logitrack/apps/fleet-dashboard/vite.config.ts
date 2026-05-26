import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    federation({
      name: 'fleetDashboard',
      filename: 'remoteEntry.js',
      exposes: {
        './FleetDashboardPage': './src/FleetDashboardPage.tsx',
        './Fleet3DPage': './src/pages/Fleet3DPage.tsx',
      },
      shared: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
    }),
  ],
  server: {
    port: 5175,
  },
  preview: {
    port: 5175,
  },
  build: {
    target: 'esnext',
  },
});
