import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { interpolateYlOrRd, scaleSequential } from 'd3';
import Plot from 'react-plotly.js';
import { Button, Card, LiveSimulationBadge, PageHeader, StateMessage, Table, type TableColumn } from '@logitrack/ui';
import { createDebouncedInvalidator, getAnalyticsSummaryGraphql, queryKeys, routeLiveEvent, subscribeToFleetEvents } from '@logitrack/api-client';
import type {
  AnalyticsFilters,
  DriverPerformanceItem,
  LiveFleetEvent,
  RegionBreakdownItem,
  VehiclePerformanceItem,
} from '@logitrack/types';

import { latestWindow } from './chartData';
import { downloadCsv } from './csv';
import './AnalyticsPage.css';

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

const regionColumns: TableColumn<RegionBreakdownItem>[] = [
  { key: 'region', header: 'Region', render: (region) => region.region },
  { key: 'total', header: 'Total', align: 'right', render: (region) => region.totalDeliveries },
  { key: 'delayed', header: 'Delayed', align: 'right', render: (region) => region.delayedDeliveries },
  {
    key: 'avgDelay',
    header: 'Avg delay',
    align: 'right',
    render: (region) => `${numberFormatter.format(region.averageDelayMinutes)} min`,
  },
  {
    key: 'delayRate',
    header: 'Delay rate',
    align: 'right',
    render: (region) => `${numberFormatter.format(region.delayRate)}%`,
  },
];

const driverColumns: TableColumn<DriverPerformanceItem>[] = [
  { key: 'driver', header: 'Driver', render: (driver) => driver.driverName },
  { key: 'total', header: 'Total', align: 'right', render: (driver) => driver.totalDeliveries },
  { key: 'delayed', header: 'Delayed', align: 'right', render: (driver) => driver.delayedDeliveries },
  {
    key: 'avgDelay',
    header: 'Avg delay',
    align: 'right',
    render: (driver) => `${numberFormatter.format(driver.averageDelayMinutes)} min`,
  },
  {
    key: 'onTime',
    header: 'On time',
    align: 'right',
    render: (driver) => `${numberFormatter.format(driver.onTimeRate)}%`,
  },
];

const vehicleColumns: TableColumn<VehiclePerformanceItem>[] = [
  { key: 'vehicle', header: 'Vehicle', render: (vehicle) => vehicle.plate },
  { key: 'total', header: 'Total', align: 'right', render: (vehicle) => vehicle.totalDeliveries },
  { key: 'delayed', header: 'Delayed', align: 'right', render: (vehicle) => vehicle.delayedDeliveries },
  {
    key: 'avgDelay',
    header: 'Avg delay',
    align: 'right',
    render: (vehicle) => `${numberFormatter.format(vehicle.averageDelayMinutes)} min`,
  },
  {
    key: 'onTime',
    header: 'On time',
    align: 'right',
    render: (vehicle) => `${numberFormatter.format(vehicle.onTimeRate)}%`,
  },
];

type RouteEfficiencyItem = {
  averageDelayMinutes: number;
  delayedDeliveries: number;
  efficiencyScore: number;
  onTimeRate: number;
  plate: string;
  totalDeliveries: number;
  vehicleId: string;
};

const routeEfficiencyColumns: TableColumn<RouteEfficiencyItem>[] = [
  { key: 'route', header: 'Route vehicle', render: (route) => route.plate },
  { key: 'total', header: 'Total', align: 'right', render: (route) => route.totalDeliveries },
  { key: 'delayed', header: 'Delayed', align: 'right', render: (route) => route.delayedDeliveries },
  {
    key: 'score',
    header: 'Efficiency score',
    align: 'right',
    render: (route) => `${numberFormatter.format(route.efficiencyScore)}%`,
  },
];

export function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [lastLiveEvent, setLastLiveEvent] = useState<LiveFleetEvent | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'reconnecting' | 'disconnected'>('connecting');
  const [filters, setFilters] = useState<AnalyticsFilters>({
    from: '2026-05-01',
    to: '2026-05-25',
    region: '',
  });
  const queryFilters = useMemo(() => ({
    from: filters.from,
    to: filters.to,
    region: filters.region?.trim() || undefined,
  }), [filters]);
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.analyticsSummary(queryFilters),
    queryFn: () => getAnalyticsSummaryGraphql(queryFilters),
    refetchInterval: 15000,
  });
  const delayTrendChartData = useMemo(() => latestWindow(data?.delayTrend ?? [], 50), [data?.delayTrend]);
  const regionChartData = useMemo(() => latestWindow(data?.regionBreakdown ?? [], 50), [data?.regionBreakdown]);
  const routeEfficiency = useMemo(() => buildRouteEfficiency(data?.vehiclePerformance ?? []), [data?.vehiclePerformance]);

  useEffect(() => {
    const analyticsInvalidator = createDebouncedInvalidator(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.analyticsSummary(queryFilters) });
    }, 1500);

    const unsubscribe = subscribeToFleetEvents({
      onError: () => setConnectionState((current) => (current === 'connected' ? 'reconnecting' : 'disconnected')),
      onMessage: (event) => {
        setConnectionState('connected');
        setLastLiveEvent(event);
        if (routeLiveEvent(event).targets.includes('analyticsSummary')) {
          analyticsInvalidator.schedule();
        }
      },
      onOpen: () => setConnectionState('connected'),
    });

    return () => {
      analyticsInvalidator.dispose();
      unsubscribe();
    };
  }, [queryClient, queryFilters]);

  if (isLoading) {
    return <StateMessage title="Loading analytics" description="Fetching historical delivery metrics from the backend API." />;
  }

  if (error || !data) {
    return (
      <>
        <PageHeader
          eyebrow="Remote app"
          title="Analytics"
          description="The analytics summary could not reach the backend API."
          actions={<Button onClick={() => void refetch()}>Retry</Button>}
        />
        <StateMessage title="Analytics unavailable" description="Start the backend and try again." />
      </>
    );
  }

  return (
    <div className="analytics-page">
      <PageHeader
        eyebrow="Analytics remote"
        title="Analytics"
        description={`Historical GraphQL analytics with live simulation refresh context. Last event: ${lastLiveEvent?.eventType ?? 'waiting'}.`}
        actions={
          <div className="analytics-filters" aria-label="Analytics filters">
            <LiveSimulationBadge connectionState={connectionState} lastEvent={lastLiveEvent} />
            <label>
              From
              <input onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} type="date" value={filters.from} />
            </label>
            <label>
              To
              <input onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} type="date" value={filters.to} />
            </label>
            <label>
              Region
              <input onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))} placeholder="Ankara" type="search" value={filters.region} />
            </label>
          </div>
        }
      />

      <section className="analytics-live-context" aria-label="Live simulation analytics context">
        <AnalyticsKpi label="Live stream" value={connectionState} />
        <AnalyticsKpi label="Simulation run" value={lastLiveEvent?.simulationRunId?.slice(0, 8) ?? 'pending'} />
        <AnalyticsKpi label="Processed" value={lastLiveEvent?.processedRecords != null && lastLiveEvent?.totalRecords != null
          ? `${lastLiveEvent.processedRecords} / ${lastLiveEvent.totalRecords}`
          : 'pending'} />
        <AnalyticsKpi label="Refresh window" value="15s" />
      </section>

      {data.summary.totalDeliveries === 0 ? (
        <StateMessage title="No analytics data" description="Try a wider date range or clear the region filter." />
      ) : (
        <>
          <section className="analytics-kpis" aria-label="Analytics KPI summary">
            <AnalyticsKpi label="Total deliveries" value={data.summary.totalDeliveries} />
            <AnalyticsKpi label="Delayed deliveries" value={data.summary.delayedDeliveries} />
            <AnalyticsKpi label="Average delay" value={`${numberFormatter.format(data.summary.averageDelayMinutes)} min`} />
            <AnalyticsKpi label="On-time rate" value={`${numberFormatter.format(data.summary.onTimeRate)}%`} />
          </section>

          <div className="analytics-grid">
            <AnalyticsSection title="Delay trend" description="Daily delivery volume and average delay from backend delayTrend data.">
              <div className="analytics-chart" aria-label="Delay trend chart">
                <Plot
                  config={{ displayModeBar: false, responsive: true }}
                  data={[
                    {
                      mode: 'lines+markers',
                      name: 'Average delay',
                      type: 'scatter',
                      x: delayTrendChartData.map((item) => item.date),
                      y: delayTrendChartData.map((item) => item.averageDelayMinutes),
                    },
                    {
                      mode: 'lines+markers',
                      name: 'Delayed deliveries',
                      type: 'scatter',
                      x: delayTrendChartData.map((item) => item.date),
                      y: delayTrendChartData.map((item) => item.delayedDeliveries),
                    },
                  ]}
                  layout={{
                    autosize: true,
                    margin: { b: 44, l: 42, r: 18, t: 12 },
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    xaxis: { automargin: true },
                    yaxis: { automargin: true },
                  }}
                  style={{ height: '260px', width: '100%' }}
                  useResizeHandler
                />
              </div>
            </AnalyticsSection>

            <AnalyticsSection title="D3 region heatmap" description="Regional delay severity, volume, delayed count, and average delay from backend regionBreakdown data.">
              <RegionHeatmap regions={regionChartData} />
            </AnalyticsSection>
          </div>

          <AnalyticsTableSection actions={null} description="Vehicle-level route efficiency derived from on-time rate and average delay." title="Route efficiency dashboard">
            <section className="route-efficiency-kpis" aria-label="Route efficiency KPIs">
              <AnalyticsKpi label="Best score" value={`${numberFormatter.format(routeEfficiency[0]?.efficiencyScore ?? 0)}%`} />
              <AnalyticsKpi label="Routes scored" value={routeEfficiency.length} />
              <AnalyticsKpi label="Avg route score" value={`${numberFormatter.format(average(routeEfficiency.map((route) => route.efficiencyScore)))}%`} />
            </section>
            <Table ariaLabel="Route efficiency" columns={routeEfficiencyColumns} emptyMessage="No route efficiency data matches the current filters." getRowKey={(route) => route.vehicleId} rows={routeEfficiency} virtualized />
          </AnalyticsTableSection>

          <AnalyticsTableSection actions={null} description="Regional totals, delays, and delay rates." title="Region breakdown">
            <Table ariaLabel="Region delay analysis" columns={regionColumns} emptyMessage="No region data matches the current filters." getRowKey={(region) => region.region} rows={data.regionBreakdown} virtualized />
          </AnalyticsTableSection>

          <AnalyticsTableSection
            actions={<Button onClick={() => downloadCsv('driver-performance.csv', data.driverPerformance, [
              { header: 'Driver ID', value: (row) => row.driverId },
              { header: 'Driver Name', value: (row) => row.driverName },
              { header: 'Total Deliveries', value: (row) => row.totalDeliveries },
              { header: 'Delayed Deliveries', value: (row) => row.delayedDeliveries },
              { header: 'Average Delay Minutes', value: (row) => row.averageDelayMinutes },
              { header: 'On-Time Rate', value: (row) => row.onTimeRate },
            ])} variant="secondary">Export CSV</Button>}
            description="Driver-level delivery performance from filtered backend data."
            title="Driver performance"
          >
            <Table ariaLabel="Driver performance" columns={driverColumns} emptyMessage="No driver performance data matches the current filters." getRowKey={(driver) => driver.driverId} rows={data.driverPerformance} virtualized />
          </AnalyticsTableSection>

          <AnalyticsTableSection
            actions={<Button onClick={() => downloadCsv('vehicle-performance.csv', data.vehiclePerformance, [
              { header: 'Vehicle ID', value: (row) => row.vehicleId },
              { header: 'Plate', value: (row) => row.plate },
              { header: 'Total Deliveries', value: (row) => row.totalDeliveries },
              { header: 'Delayed Deliveries', value: (row) => row.delayedDeliveries },
              { header: 'Average Delay Minutes', value: (row) => row.averageDelayMinutes },
              { header: 'On-Time Rate', value: (row) => row.onTimeRate },
            ])} variant="secondary">Export CSV</Button>}
            description="Vehicle-level delivery performance from filtered backend data."
            title="Vehicle performance"
          >
            <Table ariaLabel="Vehicle performance" columns={vehicleColumns} emptyMessage="No vehicle performance data matches the current filters." getRowKey={(vehicle) => vehicle.vehicleId} rows={data.vehiclePerformance} virtualized />
          </AnalyticsTableSection>
        </>
      )}
    </div>
  );
}

function RegionHeatmap({ regions }: { regions: RegionBreakdownItem[] }) {
  const maxDelayRate = Math.max(1, ...regions.map((region) => region.delayRate));
  const maxDeliveries = Math.max(1, ...regions.map((region) => region.totalDeliveries));
  const sortedRegions = [...regions].sort((first, second) => second.delayRate - first.delayRate || second.totalDeliveries - first.totalDeliveries);
  const color = scaleSequential([0, maxDelayRate], interpolateYlOrRd);
  const criticalRegions = regions.filter((region) => region.delayRate >= 45).length;
  const averageDelayRate = average(regions.map((region) => region.delayRate));

  if (regions.length === 0) {
    return <StateMessage title="No heatmap data" description="No region data matches the current filters." />;
  }

  return (
    <div className="region-heatmap-panel">
      <div className="region-heatmap-summary" aria-label="Region heatmap summary">
        <AnalyticsKpi label="Regions" value={regions.length} />
        <AnalyticsKpi label="Avg delay rate" value={`${numberFormatter.format(averageDelayRate)}%`} />
        <AnalyticsKpi label="Critical regions" value={criticalRegions} />
      </div>
      <div className="region-heatmap" aria-label="D3 region delay heatmap">
        {sortedRegions.map((region, index) => {
          const severity = getRegionSeverity(region.delayRate);
          const delayWidth = Math.max(4, (region.delayRate / maxDelayRate) * 100);
          const volumeWidth = Math.max(4, (region.totalDeliveries / maxDeliveries) * 100);

          return (
            <article
              className={`region-heatmap__cell region-heatmap__cell--${severity.tone}`}
              key={region.region}
              style={{ '--heatmap-color': color(region.delayRate) } as CSSProperties}
              title={`${region.region}: ${numberFormatter.format(region.delayRate)}% delay rate`}
            >
              <div className="region-heatmap__header">
                <span>#{index + 1}</span>
                <strong>{region.region}</strong>
              </div>
              <div className="region-heatmap__severity">
                <i />
                {severity.label}
              </div>
              <div className="region-heatmap__rate">
                <strong>{numberFormatter.format(region.delayRate)}%</strong>
                <span>delay rate</span>
              </div>
              <dl className="region-heatmap__metrics">
                <div>
                  <dt>Total</dt>
                  <dd>{region.totalDeliveries}</dd>
                </div>
                <div>
                  <dt>Delayed</dt>
                  <dd>{region.delayedDeliveries}</dd>
                </div>
                <div>
                  <dt>Avg delay</dt>
                  <dd>{numberFormatter.format(region.averageDelayMinutes)}m</dd>
                </div>
              </dl>
              <div className="region-heatmap__bars" aria-hidden="true">
                <span style={{ width: `${delayWidth}%` }} />
                <span style={{ width: `${volumeWidth}%` }} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function getRegionSeverity(delayRate: number) {
  if (delayRate >= 45) {
    return { label: 'High delay', tone: 'high' };
  }

  if (delayRate >= 25) {
    return { label: 'Medium delay', tone: 'medium' };
  }

  return { label: 'Low delay', tone: 'low' };
}

function buildRouteEfficiency(vehicles: VehiclePerformanceItem[]): RouteEfficiencyItem[] {
  return vehicles
    .map((vehicle) => ({
      averageDelayMinutes: vehicle.averageDelayMinutes,
      delayedDeliveries: vehicle.delayedDeliveries,
      efficiencyScore: Math.max(0, Math.min(100, vehicle.onTimeRate - vehicle.averageDelayMinutes * 0.3)),
      onTimeRate: vehicle.onTimeRate,
      plate: vehicle.plate,
      totalDeliveries: vehicle.totalDeliveries,
      vehicleId: vehicle.vehicleId,
    }))
    .sort((first, second) => second.efficiencyScore - first.efficiencyScore);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export default AnalyticsPage;

function AnalyticsKpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="analytics-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AnalyticsSection({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return (
    <Card className="analytics-section">
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </Card>
  );
}

function AnalyticsTableSection({ actions, children, description, title }: { actions: ReactNode; children: ReactNode; description: string; title: string }) {
  return (
    <section className="analytics-table-section">
      <div className="analytics-table-section__header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
