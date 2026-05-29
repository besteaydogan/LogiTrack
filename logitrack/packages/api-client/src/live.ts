import { API_BASE_URL, websocketUrl } from './config';
import type { LiveFleetEvent, VehicleListResponse } from '@logitrack/types';

export type LiveAffectedScreen = 'Dashboard' | 'Deliveries' | 'Alerts' | 'Analytics' | 'Fleet' | 'Vehicle detail';

export type LiveInvalidationTarget =
  | 'dashboardSummary'
  | 'deliveries'
  | 'alerts'
  | 'analyticsSummary'
  | 'vehicles'
  | 'vehicleDetail';

type LiveEventRoute = {
  screens: LiveAffectedScreen[];
  targets: LiveInvalidationTarget[];
  patchVehicle?: boolean;
};

const liveEventRoutes: Record<LiveFleetEvent['eventType'], LiveEventRoute> = {
  'delivery.created': {
    screens: ['Dashboard', 'Deliveries', 'Analytics', 'Fleet'],
    targets: ['dashboardSummary', 'deliveries', 'analyticsSummary'],
  },
  'delivery.status.changed': {
    screens: ['Dashboard', 'Deliveries', 'Analytics', 'Fleet'],
    targets: ['dashboardSummary', 'deliveries', 'analyticsSummary'],
  },
  'delivery.delayed': {
    screens: ['Dashboard', 'Deliveries', 'Alerts', 'Analytics', 'Fleet'],
    targets: ['dashboardSummary', 'deliveries', 'alerts', 'analyticsSummary'],
  },
  'alert.created': {
    screens: ['Dashboard', 'Alerts', 'Analytics'],
    targets: ['dashboardSummary', 'alerts', 'analyticsSummary'],
  },
  'vehicle.location.updated': {
    screens: ['Fleet', 'Vehicle detail'],
    targets: ['vehicles', 'vehicleDetail'],
    patchVehicle: true,
  },
};

export function routeLiveEvent(event: LiveFleetEvent) {
  return liveEventRoutes[event.eventType];
}

export function getAffectedScreens(event: LiveFleetEvent) {
  return routeLiveEvent(event).screens;
}

export function createDebouncedInvalidator(callback: () => void, delayMs = 1000) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return {
    schedule() {
      if (timeoutId !== null) {
        return;
      }

      timeoutId = setTimeout(() => {
        timeoutId = null;
        callback();
      }, delayMs);
    },
    flush() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      callback();
    },
    dispose() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}

export function createLiveEventSource(path: string) {
  return new EventSource(`${API_BASE_URL}${path}`);
}

export function createCoalescedLiveUpdater<T>(update: (payload: T) => void, delayMs = 500) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestPayload: T | null = null;

  const flush = () => {
    if (latestPayload !== null) {
      update(latestPayload);
      latestPayload = null;
    }

    timeoutId = null;
  };

  return {
    push(payload: T) {
      latestPayload = payload;

      if (timeoutId === null) {
        timeoutId = setTimeout(flush, delayMs);
      }
    },
    dispose() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      flush();
    },
  };
}

export function subscribeToVehicleLocations({
  onError,
  onMessage,
}: {
  onError?: (event: Event) => void;
  onMessage: (payload: VehicleListResponse) => void;
}) {
  const source = createLiveEventSource('/api/live/vehicles');

  source.onmessage = (event) => {
    onMessage(JSON.parse(event.data) as VehicleListResponse);
  };

  if (onError) {
    source.onerror = onError;
  }

  return () => source.close();
}

export function subscribeToFleetEvents({
  onError,
  onMessage,
  onOpen,
}: {
  onError?: (event: Event) => void;
  onMessage: (payload: LiveFleetEvent) => void;
  onOpen?: () => void;
}) {
  let socket: WebSocket | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const connect = () => {
    socket = new WebSocket(websocketUrl('/ws/live-operations'));

    socket.onopen = () => {
      onOpen?.();
    };

    socket.onmessage = (event) => {
      onMessage(JSON.parse(event.data) as LiveFleetEvent);
    };

    socket.onerror = (event) => {
      onError?.(event);
    };

    socket.onclose = (event) => {
      if (closed) {
        return;
      }

      onError?.(event);
      reconnectTimeout = setTimeout(connect, 2000);
    };
  };

  connect();

  return () => {
    closed = true;

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }

    socket?.close();
  };
}
