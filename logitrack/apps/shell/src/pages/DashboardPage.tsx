import { useQuery } from '@tanstack/react-query';
import { LiveSimulationBadge } from '@logitrack/ui';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateMessage } from '@/components/ui/StateMessage';
import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { DeliveryStatusSummary } from '@/features/dashboard/DeliveryStatusSummary';
import { KpiCardGrid } from '@/features/dashboard/KpiCardGrid';
import { LiveEventsOverTime } from '@/features/dashboard/LiveEventsOverTime';
import { RecentAlerts } from '@/features/dashboard/RecentAlerts';
import { RegionLiveSummary } from '@/features/dashboard/RegionLiveSummary';
import { useLiveOperationsStream } from '@/features/live-operations/liveOperationsStore';
import { getDashboardSummary } from '@/services/api/logisticsApi';
import { queryKeys } from '@/services/api/queries';

import './DashboardPage.css';

export function DashboardPage() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: getDashboardSummary,
  });
  const liveState = useLiveOperationsStream({ summary: data });
  const regionMetrics = liveState.deliveries.reduce<Record<string, { region: string; deliveries: number; delayed: number; alerts: number; events: number }>>((metrics, delivery) => {
    metrics[delivery.region] ??= { region: delivery.region, deliveries: 0, delayed: 0, alerts: 0, events: 0 };
    metrics[delivery.region].deliveries += 1;
    metrics[delivery.region].delayed += delivery.status === 'DELAYED' || delivery.delayMinutes > 0 ? 1 : 0;
    metrics[delivery.region].events += 1;
    return metrics;
  }, {});

  liveState.alerts.forEach((alert) => {
    const region = alert.region ?? 'Region pending';
    regionMetrics[region] ??= { region, deliveries: 0, delayed: 0, alerts: 0, events: 0 };
    regionMetrics[region].alerts += 1;
    regionMetrics[region].events += 1;
  });

  if (isLoading) {
    return (
      <StateMessage
        title="Loading dashboard"
        description="Fetching operational summary from the backend API."
      />
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader
          title="Dashboard Overview"
          description="The dashboard could not reach the backend API."
          actions={<Button onClick={() => void refetch()}>Retry</Button>}
        />
        <StateMessage
          title="Backend unavailable"
          description="Start the backend with Docker Compose and try again."
        />
      </>
    );
  }

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Dashboard Overview"
        description={`Processed deliveries: ${liveState.processedRecords} / ${liveState.totalRecords || data.totalRecords}. Live stream: ${liveState.connectionState}.`}
        actions={(
          <>
            <LiveSimulationBadge connectionState={liveState.connectionState} lastEvent={liveState.lastEvent} />
            <Button variant="secondary" onClick={() => void refetch()}>Refresh data</Button>
          </>
        )}
      />

      <KpiCardGrid summary={liveState.summary} />

      <DashboardSection
        title="Live events over time"
        description="Runtime event volume plotted with current event timestamps."
      >
        <LiveEventsOverTime data={liveState.chartPoints} />
      </DashboardSection>

      <div className="dashboard-page__grid">
        <DashboardSection
          title="Delivery status summary"
          description="Operational status distribution updated by live delivery events."
        >
          <DeliveryStatusSummary data={liveState.summary.statusSummary} />
        </DashboardSection>

        <DashboardSection
          title="Region live activity"
          description="Live event, delay and alert counts by dataset region."
        >
          <RegionLiveSummary data={Object.values(regionMetrics)} />
        </DashboardSection>

        <DashboardSection
          title="Recent alerts"
          description="Latest unresolved alerts surfaced for operations review."
        >
          <RecentAlerts alerts={liveState.summary.recentAlerts} />
        </DashboardSection>
      </div>
    </div>
  );
}
