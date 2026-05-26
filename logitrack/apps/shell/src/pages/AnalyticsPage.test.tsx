import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { AnalyticsPage } from './AnalyticsPage';

import type { AnalyticsSummaryResponse } from '@/types/logistics';

const useAnalyticsSummaryMock = vi.fn();

vi.mock('@/services/api/useAnalyticsSummary', () => ({
  useAnalyticsSummary: (filters: unknown) => useAnalyticsSummaryMock(filters),
}));

const analyticsData: AnalyticsSummaryResponse = {
  summary: {
    totalDeliveries: 10,
    delayedDeliveries: 2,
    averageDelayMinutes: 12.4,
    onTimeRate: 80,
  },
  delayTrend: [
    {
      date: '2026-05-20',
      totalDeliveries: 10,
      delayedDeliveries: 2,
      averageDelayMinutes: 12.4,
    },
  ],
  regionBreakdown: [
    {
      region: 'Ankara-Cankaya',
      totalDeliveries: 10,
      delayedDeliveries: 2,
      averageDelayMinutes: 12.4,
      delayRate: 20,
    },
  ],
  driverPerformance: [
    {
      driverId: 'DRV-001',
      driverName: 'Ayse Demir',
      totalDeliveries: 10,
      delayedDeliveries: 2,
      averageDelayMinutes: 12.4,
      onTimeRate: 80,
    },
  ],
  vehiclePerformance: [
    {
      vehicleId: 'VHL-001',
      plate: '06 LGT 001',
      totalDeliveries: 10,
      delayedDeliveries: 2,
      averageDelayMinutes: 12.4,
      onTimeRate: 80,
    },
  ],
};

describe('AnalyticsPage', () => {
  beforeEach(() => {
    useAnalyticsSummaryMock.mockReset();
    useAnalyticsSummaryMock.mockReturnValue({
      data: analyticsData,
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    });
  });

  it('renders the loading state', () => {
    useAnalyticsSummaryMock.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      refetch: vi.fn(),
    });

    render(<AnalyticsPage />);

    expect(screen.getByText('Loading analytics')).toBeInTheDocument();
  });

  it('renders the error state', () => {
    useAnalyticsSummaryMock.mockReturnValue({
      data: undefined,
      error: new Error('Backend unavailable'),
      isLoading: false,
      refetch: vi.fn(),
    });

    render(<AnalyticsPage />);

    expect(screen.getByText('Analytics unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('renders the empty state', () => {
    useAnalyticsSummaryMock.mockReturnValue({
      data: {
        ...analyticsData,
        summary: {
          ...analyticsData.summary,
          totalDeliveries: 0,
        },
      },
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    });

    render(<AnalyticsPage />);

    expect(screen.getByText('No analytics data')).toBeInTheDocument();
  });

  it('renders analytics data from the backend response shape', () => {
    render(<AnalyticsPage />);

    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByText('Total deliveries')).toBeInTheDocument();
    expect(screen.getByText('Ankara-Cankaya')).toBeInTheDocument();
    expect(screen.getByText('Ayse Demir')).toBeInTheDocument();
    expect(screen.getByText('06 LGT 001')).toBeInTheDocument();
  });

  it('updates analytics request params when filters change', () => {
    render(<AnalyticsPage />);

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-05-10' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-05-21' } });
    fireEvent.change(screen.getByLabelText('Region'), { target: { value: 'Ankara' } });

    expect(useAnalyticsSummaryMock).toHaveBeenLastCalledWith({
      from: '2026-05-10',
      to: '2026-05-21',
      region: 'Ankara',
    });
  });
});
