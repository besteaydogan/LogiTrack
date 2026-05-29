import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateMessage } from '@/components/ui/StateMessage';
import { Table, type TableColumn } from '@/components/ui/Table';
import { useLiveOperationsStream } from '@/features/live-operations/liveOperationsStore';
import { createCoalescedLiveUpdater, createLiveEventSource } from '@/services/api/live';
import { getAlertsBySeverity, resolveAlert } from '@/services/api/logisticsApi';
import { queryKeys } from '@/services/api/queries';
import type { Alert, AlertListResponse, AlertSeverity } from '@/types/logistics';

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

export function AlertsPage() {
  const queryClient = useQueryClient();
  const [severity, setSeverity] = useState<SeverityFilter>('ALL');
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const queryKey = queryKeys.alertsBySeverity(severity);
  const { data, error, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => getAlertsBySeverity(severity),
  });
  const liveState = useLiveOperationsStream({ alerts: data });
  const visibleAlerts = severity === 'ALL'
    ? liveState.alerts
    : liveState.alerts.filter((alert) => alert.severity === severity);

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
      render: (alert) => alert.message,
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
  ], [resolveMutation]);

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
        description={`${visibleAlerts.length} live alerts. Live stream: ${liveState.connectionState || connectionState}.`}
        actions={
          <div className="alert-filter" aria-label="Alert severity filter">
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
        rows={visibleAlerts}
        virtualized
      />
    </>
  );
}
