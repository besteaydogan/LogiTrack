import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateMessage } from '@/components/ui/StateMessage';
import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { DeliveryStatusSummary } from '@/features/dashboard/DeliveryStatusSummary';
import { KpiCardGrid } from '@/features/dashboard/KpiCardGrid';
import { RecentAlerts } from '@/features/dashboard/RecentAlerts';
import { createCoalescedLiveUpdater, createLiveEventSource } from '@/services/api/live';
import { getDashboardSummary } from '@/services/api/logisticsApi';
import { queryKeys } from '@/services/api/queries';
import type { DashboardSummaryResponse } from '@/types/logistics';

import './DashboardPage.css';

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: getDashboardSummary,
  });

  useEffect(() => {
    const eventSource = createLiveEventSource('/api/live/dashboard');
    const liveUpdater = createCoalescedLiveUpdater<DashboardSummaryResponse>((summary) => {
      queryClient.setQueryData(queryKeys.dashboardSummary, summary);
    });

    eventSource.onopen = () => {
      setConnectionState('connected');
    };

    eventSource.onmessage = (event) => {
      const summary = JSON.parse(event.data) as DashboardSummaryResponse;
      liveUpdater.push(summary);
    };

    eventSource.onerror = () => {
      setConnectionState((current) => (current === 'connected' ? 'reconnecting' : 'disconnected'));
    };

    return () => {
      eventSource.close();
      liveUpdater.dispose();
      setConnectionState('disconnected');
    };
  }, [queryClient]);

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
        description={`A full-stack control tower view powered by the Spring Boot REST API. Live: ${connectionState}.`}
        actions={<Button variant="secondary" onClick={() => void refetch()}>Refresh data</Button>}
      />

      <KpiCardGrid summary={data} />

      <div className="dashboard-page__grid">
        <DashboardSection
          title="Delivery status summary"
          description="One simple Recharts view for operational status distribution."
        >
          <DeliveryStatusSummary data={data.statusSummary} />
        </DashboardSection>

        <DashboardSection
          title="Recent alerts"
          description="Latest unresolved events surfaced for operations review."
        >
          <RecentAlerts alerts={data.recentAlerts} />
        </DashboardSection>
      </div>
    </div>
  );
}
