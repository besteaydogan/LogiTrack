import { useEffect, useRef, useState } from 'react';
import { websocketUrl } from '@logitrack/api-client';

import type { ServerMetricsMessage } from '@/types/logistics';

export type MetricsConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export type ServerMetricHistoryPoint = ServerMetricsMessage & {
  label: string;
};

export type ServerMetricsState = {
  connectionStatus: MetricsConnectionStatus;
  latest: ServerMetricsMessage | null;
  history: ServerMetricHistoryPoint[];
};

const MAX_HISTORY_POINTS = 60;
const RECONNECT_DELAY_MS = 2000;

export function useServerMetricsWebSocket(): ServerMetricsState {
  const [connectionStatus, setConnectionStatus] = useState<MetricsConnectionStatus>('connecting');
  const [latest, setLatest] = useState<ServerMetricsMessage | null>(null);
  const [history, setHistory] = useState<ServerMetricHistoryPoint[]>([]);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);

  useEffect(() => {
    shouldReconnectRef.current = true;

    const connect = () => {
      setConnectionStatus((current) => (current === 'disconnected' ? 'reconnecting' : 'connecting'));
      const socket = new WebSocket(websocketUrl('/ws/server-metrics'));

      socket.onopen = () => {
        setConnectionStatus('connected');
      };

      socket.onmessage = (event) => {
        const metric = JSON.parse(event.data) as ServerMetricsMessage;
        const point = {
          ...metric,
          label: new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }).format(new Date(metric.timestamp)),
        };

        setLatest(metric);
        setHistory((current) => [...current, point].slice(-MAX_HISTORY_POINTS));
      };

      socket.onclose = () => {
        if (!shouldReconnectRef.current) {
          setConnectionStatus('disconnected');
          return;
        }

        setConnectionStatus('reconnecting');
        reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      socket.onerror = () => {
        socket.close();
      };

      return socket;
    };

    const socket = connect();

    return () => {
      shouldReconnectRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      socket.close();
    };
  }, []);

  return {
    connectionStatus,
    latest,
    history,
  };
}
