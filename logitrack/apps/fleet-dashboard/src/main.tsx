import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { FleetDashboardPage } from './FleetDashboardPage';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <main className="remote-standalone">
          <Routes>
            <Route path="/" element={<FleetDashboardPage />} />
            <Route path="/fleet" element={<FleetDashboardPage />} />
            <Route path="/fleet/vehicles/:vehicleId" element={<FleetDashboardPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
