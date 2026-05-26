import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';

export function renderWithQueryClient(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return {
    queryClient,
    ui: <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  };
}

export function renderRoute(path: string, element: ReactNode) {
  const router = createMemoryRouter([{ path, element }], { initialEntries: [path] });
  return <RouterProvider router={router} />;
}

export function createEventSourceMock() {
  const close = vi.fn();
  const eventSource = {
    close,
    onerror: null as ((event: Event) => void) | null,
    onmessage: null as ((event: MessageEvent) => void) | null,
    onopen: null as ((event: Event) => void) | null,
  };

  vi.stubGlobal('EventSource', vi.fn(() => eventSource));

  return eventSource;
}
