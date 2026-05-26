import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateMessage } from '@/components/ui/StateMessage';
import { Table, type TableColumn } from '@/components/ui/Table';
import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { useAnalyticsSummary } from '@/services/api/useAnalyticsSummary';
import type {
  AnalyticsFilters,
  DriverPerformanceItem,
  RegionBreakdownItem,
  VehiclePerformanceItem,
} from '@/types/logistics';
import { latestWindow } from '@/utils/chartData';
import { downloadCsv } from '@/utils/csv';

import './AnalyticsPage.css';

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

const regionColumns: TableColumn<RegionBreakdownItem>[] = [
  {
    key: 'region',
    header: 'Region',
    render: (region) => region.region,
  },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    render: (region) => region.totalDeliveries,
  },
  {
    key: 'delayed',
    header: 'Delayed',
    align: 'right',
    render: (region) => region.delayedDeliveries,
  },
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
  {
    key: 'driver',
    header: 'Driver',
    render: (driver) => driver.driverName,
  },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    render: (driver) => driver.totalDeliveries,
  },
  {
    key: 'delayed',
    header: 'Delayed',
    align: 'right',
    render: (driver) => driver.delayedDeliveries,
  },
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
  {
    key: 'vehicle',
    header: 'Vehicle',
    render: (vehicle) => vehicle.plate,
  },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    render: (vehicle) => vehicle.totalDeliveries,
  },
  {
    key: 'delayed',
    header: 'Delayed',
    align: 'right',
    render: (vehicle) => vehicle.delayedDeliveries,
  },
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

export function AnalyticsPage() {
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
  const { data, error, isLoading, refetch } = useAnalyticsSummary(queryFilters);
  const delayTrendChartData = useMemo(
    () => latestWindow(data?.delayTrend ?? [], 50),
    [data?.delayTrend],
  );
  const regionChartData = useMemo(
    () => latestWindow(data?.regionBreakdown ?? [], 50),
    [data?.regionBreakdown],
  );

  if (isLoading) {
    return (
      <StateMessage
        title="Loading analytics"
        description="Fetching historical delivery metrics from the backend API."
      />
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader
          title="Analytics"
          description="The analytics summary could not reach the backend API."
          actions={<Button onClick={() => void refetch()}>Retry</Button>}
        />
        <StateMessage title="Analytics unavailable" description="Start the backend and try again." />
      </>
    );
  }

  const hasData = data.summary.totalDeliveries > 0;

  return (
    <div className="analytics-page">
      <PageHeader
        title="Analytics"
        description="Historical delivery aggregation from the Spring Boot REST API."
        actions={
          <div className="analytics-filters" aria-label="Analytics filters">
            <label>
              From
              <input
                onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
                type="date"
                value={filters.from}
              />
            </label>
            <label>
              To
              <input
                onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
                type="date"
                value={filters.to}
              />
            </label>
            <label>
              Region
              <input
                onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
                placeholder="Ankara"
                type="search"
                value={filters.region}
              />
            </label>
          </div>
        }
      />

      {!hasData ? (
        <StateMessage
          title="No analytics data"
          description="Try a wider date range or clear the region filter."
        />
      ) : (
        <>
          <section className="analytics-kpis" aria-label="Analytics KPI summary">
            <AnalyticsKpi label="Total deliveries" value={data.summary.totalDeliveries} />
            <AnalyticsKpi label="Delayed deliveries" value={data.summary.delayedDeliveries} />
            <AnalyticsKpi
              label="Average delay"
              value={`${numberFormatter.format(data.summary.averageDelayMinutes)} min`}
            />
            <AnalyticsKpi label="On-time rate" value={`${numberFormatter.format(data.summary.onTimeRate)}%`} />
          </section>

          <div className="analytics-grid">
            <DashboardSection
              title="Delay trend"
              description="Daily delivery volume and average delay from backend delayTrend data."
            >
              <div className="analytics-chart" aria-label="Delay trend chart">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={delayTrendChartData}>
                    <CartesianGrid stroke="#e5edf4" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: '#526579', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#526579', fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      dataKey="averageDelayMinutes"
                      name="Average delay"
                      stroke="#0f5d8f"
                      strokeWidth={3}
                      type="monotone"
                    />
                    <Line
                      dataKey="delayedDeliveries"
                      name="Delayed deliveries"
                      stroke="#c2410c"
                      strokeWidth={3}
                      type="monotone"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DashboardSection>

            <DashboardSection
              title="Region delay analysis"
              description="Delay distribution from backend regionBreakdown data."
            >
              <div className="analytics-chart" aria-label="Region delay chart">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={regionChartData}>
                    <CartesianGrid stroke="#e5edf4" strokeDasharray="3 3" />
                    <XAxis dataKey="region" tick={{ fill: '#526579', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#526579', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="delayRate" fill="#0f766e" name="Delay rate" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DashboardSection>
          </div>

          <AnalyticsTableSection
            actions={null}
            description="Regional totals, delays, and delay rates."
            title="Region breakdown"
          >
            <Table
              ariaLabel="Region delay analysis"
              columns={regionColumns}
              emptyMessage="No region data matches the current filters."
              getRowKey={(region) => region.region}
              rows={data.regionBreakdown}
              virtualized
            />
          </AnalyticsTableSection>

          <AnalyticsTableSection
            actions={
              <Button
                onClick={() => downloadCsv('driver-performance.csv', data.driverPerformance, [
                  { header: 'Driver ID', value: (row) => row.driverId },
                  { header: 'Driver Name', value: (row) => row.driverName },
                  { header: 'Total Deliveries', value: (row) => row.totalDeliveries },
                  { header: 'Delayed Deliveries', value: (row) => row.delayedDeliveries },
                  { header: 'Average Delay Minutes', value: (row) => row.averageDelayMinutes },
                  { header: 'On-Time Rate', value: (row) => row.onTimeRate },
                ])}
                variant="secondary"
              >
                Export CSV
              </Button>
            }
            description="Driver-level delivery performance from filtered backend data."
            title="Driver performance"
          >
            <Table
              ariaLabel="Driver performance"
              columns={driverColumns}
              emptyMessage="No driver performance data matches the current filters."
              getRowKey={(driver) => driver.driverId}
              rows={data.driverPerformance}
              virtualized
            />
          </AnalyticsTableSection>

          <AnalyticsTableSection
            actions={
              <Button
                onClick={() => downloadCsv('vehicle-performance.csv', data.vehiclePerformance, [
                  { header: 'Vehicle ID', value: (row) => row.vehicleId },
                  { header: 'Plate', value: (row) => row.plate },
                  { header: 'Total Deliveries', value: (row) => row.totalDeliveries },
                  { header: 'Delayed Deliveries', value: (row) => row.delayedDeliveries },
                  { header: 'Average Delay Minutes', value: (row) => row.averageDelayMinutes },
                  { header: 'On-Time Rate', value: (row) => row.onTimeRate },
                ])}
                variant="secondary"
              >
                Export CSV
              </Button>
            }
            description="Vehicle-level delivery performance from filtered backend data."
            title="Vehicle performance"
          >
            <Table
              ariaLabel="Vehicle performance"
              columns={vehicleColumns}
              emptyMessage="No vehicle performance data matches the current filters."
              getRowKey={(vehicle) => vehicle.vehicleId}
              rows={data.vehiclePerformance}
              virtualized
            />
          </AnalyticsTableSection>
        </>
      )}
    </div>
  );
}

function AnalyticsKpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="analytics-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AnalyticsTableSection({
  actions,
  children,
  description,
  title,
}: {
  actions: React.ReactNode;
  children: React.ReactNode;
  description: string;
  title: string;
}) {
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
