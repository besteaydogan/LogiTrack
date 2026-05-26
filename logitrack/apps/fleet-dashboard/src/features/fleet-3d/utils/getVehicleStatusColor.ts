import type { VehicleStatus } from '@logitrack/types';

export function getVehicleStatusColor(status: VehicleStatus) {
  const colors: Record<VehicleStatus, string> = {
    ACTIVE: '#16a34a',
    IDLE: '#2563eb',
    MAINTENANCE: '#f59e0b',
    OFFLINE: '#dc2626',
  };

  return colors[status];
}
