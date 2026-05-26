export function createMarkerUpdateBuffer<T>(update: (payload: T) => void, delayMs = 750) {
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
