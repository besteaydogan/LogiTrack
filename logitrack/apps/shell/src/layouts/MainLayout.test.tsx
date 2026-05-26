import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { MainLayout } from './MainLayout';

describe('MainLayout', () => {
  it('renders primary navigation links', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <MainLayout />,
        children: [{ index: true, element: <div>Dashboard route</div> }],
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByRole('link', { name: /Dashboard/ })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /Deliveries/ })).toHaveAttribute('href', '/deliveries');
    expect(screen.getByRole('link', { name: /Alerts/ })).toHaveAttribute('href', '/alerts');
    expect(screen.getByRole('link', { name: /Analytics/ })).toHaveAttribute('href', '/analytics');
    expect(screen.getByRole('link', { name: /Fleet/ })).toHaveAttribute('href', '/fleet');
  });
});
