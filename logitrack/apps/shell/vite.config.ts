import { defineConfig } from 'vitest/config';
import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'test' ? null : federation({
      name: 'shell',
      remotes: {
        analytics: 'http://localhost:5174/assets/remoteEntry.js',
        fleetDashboard: 'http://localhost:5175/assets/remoteEntry.js',
        deliveryManagement: 'http://localhost:5176/assets/remoteEntry.js',
        alertCenter: 'http://localhost:5177/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': 'D:/PROJECT/LogiTrack/LogiTrack/logitrack/apps/shell/src',
      ...(mode === 'test'
        ? {
          'analytics/AnalyticsPage': 'D:/PROJECT/LogiTrack/LogiTrack/logitrack/apps/shell/src/test/AnalyticsRemoteStub.tsx',
          'fleetDashboard/FleetDashboardPage': 'D:/PROJECT/LogiTrack/LogiTrack/logitrack/apps/shell/src/test/FleetDashboardRemoteStub.tsx',
          'fleetDashboard/Fleet3DPage': 'D:/PROJECT/LogiTrack/LogiTrack/logitrack/apps/shell/src/test/FleetDashboardRemoteStub.tsx',
          'deliveryManagement/DeliveryManagementPage': 'D:/PROJECT/LogiTrack/LogiTrack/logitrack/apps/shell/src/test/DeliveryManagementRemoteStub.tsx',
          'alertCenter/AlertCenterPage': 'D:/PROJECT/LogiTrack/LogiTrack/logitrack/apps/shell/src/test/AlertCenterRemoteStub.tsx',
        }
        : {}),
    },
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 5173,
  },
  build: {
    target: 'esnext',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
}));
