import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { createLiveEventSource } from '@/services/api/live';
import { queryKeys } from '@/services/api/queries';
import type { DashboardSummaryResponse, LiveFleetEvent } from '@/types/logistics';

import {
  applyDashboardLiveEvent,
  applyDashboardSummaryLiveEvent,
  createInitialDashboardLiveState,
  type DashboardLiveState,
} from './dashboardLiveState';

export type DashboardConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

type UseDashboardLiveStreamResult = {
  connectionState: DashboardConnectionState;
  lastEvent: LiveFleetEvent | null;
  liveState: DashboardLiveState;
};

const DASHBOARD_EVENT_TYPES: LiveFleetEvent['eventType'][] = [
  'delivery.created',
  'vehicle.location.updated',
  'delivery.status.changed',
  'delivery.delayed',
  'alert.created',
];

export function useDashboardLiveStream(summary: DashboardSummaryResponse | undefined): UseDashboardLiveStreamResult {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<DashboardConnectionState>('connecting');
  const [lastEvent, setLastEvent] = useState<LiveFleetEvent | null>(null);
  const [liveState, setLiveState] = useState(() => createInitialDashboardLiveState(summary));

  useEffect(() => {
    setLiveState((current) => ({
      ...current,
      recentAlerts: summary?.recentAlerts ?? current.recentAlerts,
      statusSummary: summary?.statusSummary ?? current.statusSummary,
    }));
  }, [summary]);

  useEffect(() => {
    const source = createLiveEventSource('/api/live/dashboard');

    source.onopen = () => {
      setConnectionState('connected');
    };

    const handleEvent = (payload: LiveFleetEvent) => {
      setLastEvent(payload);
      setLiveState((current) => applyDashboardLiveEvent(current, payload));
      queryClient.setQueryData<DashboardSummaryResponse>(queryKeys.dashboardSummary, (current) => (
        current ? applyDashboardSummaryLiveEvent(current, payload) : current
      ));
    };

    DASHBOARD_EVENT_TYPES.forEach((eventType) => {
      source.addEventListener(eventType, (event) => {
        handleEvent(JSON.parse((event as MessageEvent).data) as LiveFleetEvent);
      });
    });

    source.onerror = () => {
      setConnectionState((current) => (current === 'connected' ? 'reconnecting' : 'disconnected'));
    };

    return () => {
      source.close();
      setConnectionState('disconnected');
    };
  }, [queryClient]);

  return {
    connectionState,
    lastEvent,
    liveState,
  };
}
