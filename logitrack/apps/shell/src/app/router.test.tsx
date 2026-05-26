import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { appRoutes } from './router';

describe('router', () => {
  it('exposes the analytics route through lazy loading', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/analytics'] });
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Loading page')).toBeInTheDocument();
    expect(await screen.findByText('Analytics remote route')).toBeInTheDocument();
  });

  it('exposes the fleet route through lazy loading', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/fleet'] });
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Loading page')).toBeInTheDocument();
    expect(await screen.findByText('Fleet remote route')).toBeInTheDocument();
  });

  it('exposes the fleet vehicle detail route through lazy loading', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/fleet/vehicles/veh-1'] });
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Fleet remote route')).toBeInTheDocument();
  });

  it('exposes the delivery management route through lazy loading', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/deliveries'] });
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Loading page')).toBeInTheDocument();
    expect(await screen.findByText('Delivery management remote route')).toBeInTheDocument();
  });

  it('exposes the alert center route through lazy loading', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/alerts'] });
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Loading page')).toBeInTheDocument();
    expect(await screen.findByText('Alert center remote route')).toBeInTheDocument();
  });
});
