import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createCoalescedLiveUpdater,
  createDebouncedInvalidator,
  createLiveEventSource,
  getAlertsBySeverity,
  queryKeys,
  resolveAlert,
  routeLiveEvent,
  subscribeToFleetEvents,
} from '@logitrack/api-client';
import type { Alert, AlertListResponse, AlertSeverity, LiveFleetEvent } from '@logitrack/types';
import { Badge, Button, LiveSimulationBadge, PageHeader, StateMessage, Table, type TableColumn } from '@logitrack/ui';

type SeverityFilter = 'ALL' | AlertSeverity;
type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

const severityOptions: SeverityFilter[] = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const severityTone: Record<AlertSeverity, 'info' | 'warning' | 'critical'> = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'warning',
  CRITICAL: 'critical',
};

const statusTone: Record<Alert['status'], 'neutral' | 'success'> = {
  UNRESOLVED: 'neutral',
  RESOLVED: 'success',
};

export function AlertCenterPage() {
  const queryClient = useQueryClient();
  const [severity, setSeverity] = useState<SeverityFilter>('ALL');
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [lastSimulationEvent, setLastSimulationEvent] = useState<LiveFleetEvent | null>(null);
  const [recentAlertId, setRecentAlertId] = useState<string | null>(null);
  const [simulationConnectionState, setSimulationConnectionState] = useState<ConnectionState>('connecting');
  const queryKey = queryKeys.alertsBySeverity(severity);
  const { data, error, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => getAlertsBySeverity(severity),
  });

  const resolveMutation = useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    },
  });

  useEffect(() => {
    const eventSource = createLiveEventSource('/api/live/alerts');
    const liveUpdater = createCoalescedLiveUpdater<AlertListResponse>((nextAlerts) => {
      queryClient.setQueryData(queryKeys.alertsBySeverity('ALL'), nextAlerts);
      if (severity !== 'ALL') {
        queryClient.setQueryData(queryKeys.alertsBySeverity(severity), {
          ...nextAlerts,
          items: nextAlerts.items.filter((alert) => alert.severity === severity),
        });
      }
    });

    eventSource.onopen = () => {
      setConnectionState('connected');
    };

    eventSource.onmessage = (event) => {
      const nextAlerts = JSON.parse(event.data) as AlertListResponse;
      liveUpdater.push(nextAlerts);
    };

    eventSource.onerror = () => {
      setConnectionState((current) => (current === 'connected' ? 'reconnecting' : 'disconnected'));
    };

    return () => {
      eventSource.close();
      liveUpdater.dispose();
      setConnectionState('disconnected');
    };
  }, [queryClient, severity]);

  useEffect(() => {
    const alertsInvalidator = createDebouncedInvalidator(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
      void queryClient.invalidateQueries({ queryKey });
    }, 750);
    const dashboardInvalidator = createDebouncedInvalidator(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    }, 750);

    const unsubscribe = subscribeToFleetEvents({
      onError: () => setSimulationConnectionState((current) => (current === 'connected' ? 'reconnecting' : 'disconnected')),
      onMessage: (event) => {
        setLastSimulationEvent(event);
        const route = routeLiveEvent(event);

        if (route.targets.includes('alerts')) {
          alertsInvalidator.schedule();
        }

        if (route.targets.includes('dashboardSummary')) {
          dashboardInvalidator.schedule();
        }

        if (event.eventType === 'alert.created') {
          setRecentAlertId(event.alertId);
        }
      },
      onOpen: () => setSimulationConnectionState('connected'),
    });

    return () => {
      alertsInvalidator.dispose();
      dashboardInvalidator.dispose();
      unsubscribe();
    };
  }, [queryClient, queryKey]);

  useEffect(() => {
    if (!recentAlertId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setRecentAlertId(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [recentAlertId]);

  const columns = useMemo<TableColumn<Alert>[]>(() => [
    {
      key: 'severity',
      header: 'Severity',
      render: (alert) => <Badge tone={severityTone[alert.severity]}>{alert.severity}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (alert) => <Badge tone={statusTone[alert.status]}>{alert.status}</Badge>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (alert) => alert.alertType.replace(/_/g, ' '),
    },
    {
      key: 'region',
      header: 'Region',
      render: (alert) => alert.region ?? 'Region pending',
    },
    {
      key: 'message',
      header: 'Message',
      render: (alert) => (
        <span className={alert.id === recentAlertId ? 'alert-row-highlight' : undefined}>
          {alert.message}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (alert) => new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(alert.createdAt)),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (alert) => (
        <Button
          disabled={alert.status === 'RESOLVED' || resolveMutation.isPending}
          onClick={() => resolveMutation.mutate(alert.id)}
          variant="secondary"
        >
          Resolve
        </Button>
      ),
    },
  ], [recentAlertId, resolveMutation]);

  if (isLoading) {
    return (
      <StateMessage title="Loading alerts" description="Fetching alert records from the backend API." />
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader
          title="Alert Center"
          description="The alert list could not reach the backend API."
          actions={<Button onClick={() => void refetch()}>Retry</Button>}
        />
        <StateMessage title="Alerts unavailable" description="Start the backend and try again." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Alert Center"
        description={`${data.totalItems} alerts from the backend API. Live: ${connectionState}.`}
        actions={
          <div className="alert-filter" aria-label="Alert severity filter">
            <LiveSimulationBadge connectionState={simulationConnectionState} lastEvent={lastSimulationEvent} />
            {severityOptions.map((option) => (
              <Button
                key={option}
                onClick={() => setSeverity(option)}
                variant={severity === option ? 'primary' : 'secondary'}
              >
                {option}
              </Button>
            ))}
          </div>
        }
      />
      <Table
        ariaLabel="Alert records"
        columns={columns}
        emptyMessage="No alerts match the current view."
        getRowKey={(alert) => alert.id}
        rows={data.items}
        virtualized
      />
    </>
  );
}

export default AlertCenterPage;
