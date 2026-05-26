import { useEffect, useMemo, useState } from 'react';
import { createLiveEventSource } from '@logitrack/api-client';
import type { Alert, AlertListResponse } from '@logitrack/types';

import type { Fleet3DAlertPulse, Fleet3DVehicle } from '../types/fleet3d.types';
import { getRegionScenePosition } from '../utils/mapLatLngToScenePosition';

const MAX_ALERT_PULSES = 20;

export function useFleetLiveEvents(vehicles: Fleet3DVehicle[]) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const vehiclePositions = useMemo(() => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.position])), [vehicles]);

  useEffect(() => {
    const source = createLiveEventSource('/api/live/alerts');

    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as AlertListResponse;
      setAlerts(payload.items);
    };

    return () => source.close();
  }, []);

  const pulses = useMemo<Fleet3DAlertPulse[]>(() => alerts
    .filter((alert) => alert.status === 'UNRESOLVED')
    .map((alert) => {
      const vehiclePosition = alert.vehicleId ? vehiclePositions.get(alert.vehicleId) : undefined;
      const position = vehiclePosition ?? (alert.region ? getRegionScenePosition(alert.region, 0.08) : null);

      if (!position) {
        return null;
      }

      return {
        id: alert.id,
        alert,
        createdAt: alert.createdAt,
        position,
      };
    })
    .filter((pulse): pulse is Fleet3DAlertPulse => pulse !== null)
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
    .slice(0, MAX_ALERT_PULSES), [alerts, vehiclePositions]);

  return {
    pulses,
    totalAlerts: alerts.length,
  };
}
