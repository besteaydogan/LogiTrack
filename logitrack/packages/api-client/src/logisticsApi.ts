import type {
  Alert,
  AlertListResponse,
  AnalyticsFilters,
  AnalyticsSummaryResponse,
  DashboardSummaryResponse,
  DeliveryListResponse,
  Vehicle,
  VehicleListResponse,
} from '@logitrack/types';

import { apiRequest } from './http';

export const queryKeys = {
  dashboardSummary: ['dashboard-summary'] as const,
  deliveries: ['deliveries'] as const,
  alerts: ['alerts'] as const,
  alertsBySeverity: (severity: string) => ['alerts', severity] as const,
  vehicles: ['vehicles'] as const,
  vehicle: (id: string) => ['vehicles', id] as const,
  analyticsSummary: (filters: AnalyticsFilters) => [
    'analytics-summary',
    filters.from ?? '',
    filters.to ?? '',
    filters.region ?? '',
  ] as const,
};

export function getDashboardSummary() {
  return apiRequest<DashboardSummaryResponse>('/api/dashboard/summary');
}

export function getVehicles() {
  return apiRequest<VehicleListResponse>('/api/vehicles');
}

export function getVehicleById(id: string) {
  return apiRequest<Vehicle>(`/api/vehicles/${id}`);
}

export function getDeliveries() {
  return apiRequest<DeliveryListResponse>('/api/deliveries');
}

export function getAlerts() {
  return apiRequest<AlertListResponse>('/api/alerts');
}

export function getAlertsBySeverity(severity: string) {
  const query = severity === 'ALL' ? '' : `?severity=${encodeURIComponent(severity)}`;
  return apiRequest<AlertListResponse>(`/api/alerts${query}`);
}

export function resolveAlert(id: string) {
  return apiRequest<Alert>(`/api/alerts/${id}/resolve`, { method: 'PATCH' });
}

export function getAnalyticsSummary(filters: AnalyticsFilters) {
  const params = new URLSearchParams();

  if (filters.from) {
    params.set('from', filters.from);
  }

  if (filters.to) {
    params.set('to', filters.to);
  }

  if (filters.region) {
    params.set('region', filters.region);
  }

  const query = params.toString();
  return apiRequest<AnalyticsSummaryResponse>(`/api/analytics/summary${query ? `?${query}` : ''}`);
}

export async function getAnalyticsSummaryGraphql(filters: AnalyticsFilters) {
  const response = await apiRequest<{ data?: { deliveryAnalytics: AnalyticsSummaryResponse }; errors?: { message: string }[] }>('/graphql', {
    body: {
      query: `
        query DeliveryAnalytics($from: String, $to: String, $region: String) {
          deliveryAnalytics(from: $from, to: $to, region: $region) {
            summary {
              totalDeliveries
              delayedDeliveries
              averageDelayMinutes
              onTimeRate
            }
            delayTrend {
              date
              totalDeliveries
              delayedDeliveries
              averageDelayMinutes
            }
            regionBreakdown {
              region
              totalDeliveries
              delayedDeliveries
              averageDelayMinutes
              delayRate
            }
            driverPerformance {
              driverId
              driverName
              totalDeliveries
              delayedDeliveries
              averageDelayMinutes
              onTimeRate
            }
            vehiclePerformance {
              vehicleId
              plate
              totalDeliveries
              delayedDeliveries
              averageDelayMinutes
              onTimeRate
            }
          }
        }
      `,
      variables: {
        from: filters.from || null,
        to: filters.to || null,
        region: filters.region || null,
      },
    },
    method: 'POST',
  });

  if (response.errors?.length) {
    throw new Error(response.errors.map((error) => error.message).join('; '));
  }

  if (!response.data) {
    throw new Error('GraphQL analytics response did not include data.');
  }

  return response.data.deliveryAnalytics;
}
