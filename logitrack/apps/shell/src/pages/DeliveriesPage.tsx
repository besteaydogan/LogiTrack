import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LiveSimulationBadge } from '@logitrack/ui';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateMessage } from '@/components/ui/StateMessage';
import { Table, type TableColumn } from '@/components/ui/Table';
import { useLiveOperationsStream } from '@/features/live-operations/liveOperationsStore';
import { subscribeToFleetEvents } from '@/services/api/live';
import { getDeliveries } from '@/services/api/logisticsApi';
import { queryKeys } from '@/services/api/queries';
import type { Delivery, DeliveryListResponse, LiveFleetEvent } from '@/types/logistics';

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

export function DeliveriesPage() {
  const queryClient = useQueryClient();
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.deliveries,
    queryFn: getDeliveries,
  });
  const liveState = useLiveOperationsStream({ deliveries: data });

  useEffect(() => subscribeToFleetEvents({
    onMessage: (event) => {
      if (event.eventType === 'delivery.created' || event.eventType === 'delivery.status.changed' || event.eventType === 'delivery.delayed') {
        queryClient.setQueryData<DeliveryListResponse>(queryKeys.deliveries, (current) => patchDeliveries(current, event));
      }
    },
  }), [queryClient]);

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
          title="Delivery Tracking"
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
        title="Delivery Tracking"
        description={`Processed deliveries: ${liveState.processedRecords} / ${liveState.totalRecords || data.totalItems}. Live stream: ${liveState.connectionState}.`}
        actions={<LiveSimulationBadge connectionState={liveState.connectionState} lastEvent={liveState.lastEvent} />}
      />
      <Table
        ariaLabel="Delivery records"
        columns={columns}
        emptyMessage="No delivery records are available."
        getRowKey={(delivery) => delivery.id}
        rows={liveState.deliveries}
        virtualized
      />
    </>
  );
}

function patchDeliveries(current: DeliveryListResponse | undefined, event: LiveFleetEvent) {
  if (!current || !event.deliveryId) {
    return current;
  }

  if (event.eventType === 'delivery.created') {
    const delivery: Delivery = {
      id: event.deliveryId,
      trackingNumber: event.trackingNumber ?? event.deliveryId,
      status: event.status,
      priority: event.priority ?? 'NORMAL',
      region: event.region ?? 'Region pending',
      vehicle: { id: event.vehicleId ?? 'pending', plate: event.vehicleId ?? 'pending' },
      driver: { id: event.driverId ?? 'pending', name: event.driverId ?? 'Driver pending' },
      warehouse: { id: event.warehouseId ?? 'pending', name: event.warehouseId ?? 'Warehouse pending' },
      estimatedDeliveryTime: event.estimatedDeliveryTime ?? event.timestamp,
      actualDeliveryTime: event.actualDeliveryTime ?? null,
      delayMinutes: event.delayMinutes ?? 0,
      lastUpdatedAt: event.timestamp,
    };

    return {
      ...current,
      totalItems: Math.max(current.totalItems, current.items.length + 1),
      items: [delivery, ...current.items.filter((item) => item.id !== delivery.id)],
    };
  }

  return {
    ...current,
    items: current.items.map((delivery) => {
      if (delivery.id !== event.deliveryId) {
        return delivery;
      }

      if (event.eventType === 'delivery.delayed') {
        return {
          ...delivery,
          status: 'DELAYED' as const,
          delayMinutes: Math.max(delivery.delayMinutes, event.delayMinutes),
          lastUpdatedAt: event.timestamp,
        };
      }

      if (event.eventType === 'delivery.status.changed') {
        return {
          ...delivery,
          status: event.status,
          actualDeliveryTime: event.status === 'DELIVERED' ? event.timestamp : delivery.actualDeliveryTime,
          lastUpdatedAt: event.timestamp,
        };
      }

      return delivery;
    }),
  };
}
