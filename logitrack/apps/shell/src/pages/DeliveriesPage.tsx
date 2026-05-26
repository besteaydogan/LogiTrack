import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateMessage } from '@/components/ui/StateMessage';
import { Table, type TableColumn } from '@/components/ui/Table';
import { getDeliveries } from '@/services/api/logisticsApi';
import { queryKeys } from '@/services/api/queries';
import type { Delivery } from '@/types/logistics';

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
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.deliveries,
    queryFn: getDeliveries,
  });

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
        description={`${data.totalItems} delivery records from the backend API.`}
      />
      <Table
        ariaLabel="Delivery records"
        columns={columns}
        emptyMessage="No delivery records are available."
        getRowKey={(delivery) => delivery.id}
        rows={data.items}
        virtualized
      />
    </>
  );
}
