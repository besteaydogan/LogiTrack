import type { DeliveryStatus } from '@logitrack/types';

export function getRouteColor(status: DeliveryStatus) {
  const colors: Record<DeliveryStatus, string> = {
    CREATED: '#64748b',
    ASSIGNED: '#0284c7',
    IN_TRANSIT: '#15803d',
    DELAYED: '#b91c1c',
    DELIVERED: '#94a3b8',
    CANCELLED: '#475569',
  };

  return colors[status];
}
