import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createDebouncedInvalidator, createLiveEventSource, queryKeys, routeLiveEvent, subscribeToFleetEvents } from '@logitrack/api-client';
import type { Alert, AlertListResponse, VehicleListResponse } from '@logitrack/types';

import type { Fleet3DAlertPulse, Fleet3DVehicle } from '../types/fleet3d.types';
import { getRegionScenePosition } from '../utils/mapLatLngToScenePosition';

const MAX_ALERT_PULSES = 20;

export function useFleetLiveEvents(vehicles: Fleet3DVehicle[]) {
  const queryClient = useQueryClient();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lastEventType, setLastEventType] = useState<string | null>(null);
  const vehiclePositions = useMemo(() => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle.position])), [vehicles]);

  useEffect(() => {
    const source = createLiveEventSource('/api/live/alerts');

    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as AlertListResponse;
      setAlerts(payload.items);
    };

    return () => source.close();
  }, []);

  useEffect(() => {
    const deliveriesInvalidator = createDebouncedInvalidator(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.deliveries });
    }, 750);
    const analyticsInvalidator = createDebouncedInvalidator(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.analyticsSummary({
        from: '2026-05-01',
        to: '2026-05-25',
        region: undefined,
      }) });
    }, 1500);
    const alertsInvalidator = createDebouncedInvalidator(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    }, 750);

    const unsubscribe = subscribeToFleetEvents({
      onMessage: (event) => {
        setLastEventType(event.eventType);
        const route = routeLiveEvent(event);

        if (route.patchVehicle && event.eventType === 'vehicle.location.updated') {
          queryClient.setQueryData<VehicleListResponse>(queryKeys.vehicles, (current) => current ? ({
            ...current,
            items: current.items.map((vehicle) => vehicle.id === event.vehicleId ? {
              ...vehicle,
              lastLatitude: event.latitude,
              lastLongitude: event.longitude,
              lastSeenAt: event.timestamp,
              status: event.status,
            } : vehicle),
          }) : current);
        }

        if (route.targets.includes('deliveries')) {
          deliveriesInvalidator.schedule();
        }
        if (route.targets.includes('analyticsSummary')) {
          analyticsInvalidator.schedule();
        }
        if (route.targets.includes('alerts')) {
          alertsInvalidator.schedule();
        }

        if (event.vehicleId) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.vehicle(event.vehicleId) });
        }

        if (event.eventType === 'alert.created') {
          setAlerts((current) => [
            {
              id: event.alertId,
              alertType: 'DELIVERY_DELAY',
              severity: event.severity,
              status: 'UNRESOLVED',
              message: event.message,
              deliveryId: event.deliveryId,
              vehicleId: event.vehicleId,
              region: event.region ?? undefined,
              createdAt: event.timestamp,
              resolvedAt: null,
            },
            ...current.filter((alert) => alert.id !== event.alertId),
          ]);
        }
      },
    });

    return () => {
      deliveriesInvalidator.dispose();
      analyticsInvalidator.dispose();
      alertsInvalidator.dispose();
      unsubscribe();
    };
  }, [queryClient]);

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
    lastEventType,
    pulses,
    totalAlerts: alerts.length,
  };
}
