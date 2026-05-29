import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { createDebouncedInvalidator, getDeliveries, queryKeys, routeLiveEvent, subscribeToFleetEvents } from '@logitrack/api-client';
import type { Delivery, LiveFleetEvent } from '@logitrack/types';
import { Badge, Button, LiveSimulationBadge, PageHeader, StateMessage, Table, type TableColumn } from '@logitrack/ui';

import './DeliveryManagementPage.css';

const statusTone: Record<Delivery['status'], 'neutral' | 'info' | 'warning' | 'critical' | 'success'> = {
  CREATED: 'neutral',
  ASSIGNED: 'info',
  IN_TRANSIT: 'info',
  DELAYED: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'critical',
};

const columns: TableColumn<Delivery>[] = [
  {
    key: 'trackingNumber',
    header: 'Tracking #',
    render: (delivery) => delivery.trackingNumber,
  },
  {
    key: 'status',
    header: 'Status',
    render: (delivery) => <Badge tone={statusTone[delivery.status]}>{delivery.status}</Badge>,
  },
  {
    key: 'priority',
    header: 'Priority',
    render: (delivery) => delivery.priority,
  },
  {
    key: 'region',
    header: 'Region',
    render: (delivery) => delivery.region,
  },
  {
    key: 'vehicle',
    header: 'Vehicle',
    render: (delivery) => delivery.vehicle.plate,
  },
  {
    key: 'driver',
    header: 'Driver',
    render: (delivery) => delivery.driver.name,
  },
  {
    key: 'eta',
    header: 'ETA',
    render: (delivery) => new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(delivery.estimatedDeliveryTime)),
  },
  {
    key: 'delay',
    header: 'Delay',
    align: 'right',
    render: (delivery) => `${delivery.delayMinutes} min`,
  },
];

export function DeliveryManagementPage() {
  const queryClient = useQueryClient();
  const [lastLiveEvent, setLastLiveEvent] = useState<LiveFleetEvent | null>(null);
  const [highlightedDeliveryId, setHighlightedDeliveryId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'reconnecting' | 'disconnected'>('connecting');
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.deliveries,
    queryFn: getDeliveries,
  });
  const rows = useMemo(() => data?.items ?? [], [data?.items]);

  useEffect(() => {
    const deliveriesInvalidator = createDebouncedInvalidator(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.deliveries });
    }, 750);

    const unsubscribe = subscribeToFleetEvents({
      onError: () => setConnectionState((current) => (current === 'connected' ? 'reconnecting' : 'disconnected')),
      onMessage: (event) => {
        setConnectionState('connected');
        setLastLiveEvent(event);

        if (routeLiveEvent(event).targets.includes('deliveries')) {
          deliveriesInvalidator.schedule();
          if (event.deliveryId) {
            setHighlightedDeliveryId(event.deliveryId);
          }
        }
      },
      onOpen: () => setConnectionState('connected'),
    });

    return () => {
      deliveriesInvalidator.dispose();
      unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    if (!highlightedDeliveryId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setHighlightedDeliveryId(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [highlightedDeliveryId]);

  if (isLoading) {
    return (
      <StateMessage
        title="Loading deliveries"
        description="Fetching delivery records from the backend API."
      />
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader
          title="Delivery Management"
          description="The delivery list could not reach the backend API."
          actions={<Button onClick={() => void refetch()}>Retry</Button>}
        />
        <StateMessage title="Deliveries unavailable" description="Start the backend and try again." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Delivery Management"
        description={`${data.totalItems} delivery records from the backend API.`}
        actions={<LiveSimulationBadge connectionState={connectionState} lastEvent={lastLiveEvent} />}
      />
      <Table
        ariaLabel="Delivery records"
        columns={columns}
        emptyMessage="No delivery records are available."
        getRowClassName={(delivery) => delivery.id === highlightedDeliveryId ? 'delivery-row-highlight' : undefined}
        getRowKey={(delivery) => delivery.id}
        rows={rows}
        virtualized
      />
    </>
  );
}

export default DeliveryManagementPage;
