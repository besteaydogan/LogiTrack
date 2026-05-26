import { API_BASE_URL } from './config';
import type { VehicleListResponse } from '@logitrack/types';

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
