import { Activity, Cpu, HardDrive, Radio, Server, Timer, Users } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateMessage } from '@/components/ui/StateMessage';
import { SystemMetricCard } from '@/features/system-metrics/SystemMetricCard';
import { useServerMetricsWebSocket } from '@/features/system-metrics/useServerMetricsWebSocket';

import './DashboardPage.css';

export function DashboardPage() {
  const { connectionStatus, history, latest } = useServerMetricsWebSocket();

  if (!latest && history.length === 0) {
    return (
      <div className="dashboard-page">
        <PageHeader
          title="System Metrics"
          description={`WebSocket stream: ${connectionStatus}. Waiting for backend server metrics.`}
          actions={<ConnectionBadge status={connectionStatus} />}
        />
        <StateMessage title="Waiting for metrics" description="Opening a WebSocket connection to the backend metrics stream." />
      </div>
    );
  }

  const cpuTone = toneForPercent(latest?.cpuUsagePercent ?? 0);
  const memoryTone = toneForPercent(latest?.memoryUsagePercent ?? 0);

  return (
    <div className="dashboard-page">
      <PageHeader
        title="System Metrics"
        description="Real-time backend server metrics streamed over WebSocket."
        actions={<ConnectionBadge status={connectionStatus} />}
      />

      <section className="system-metric-grid" aria-label="Realtime server metrics">
        <SystemMetricCard
          helper="Backend CPU load"
          icon={Cpu}
          label="CPU usage"
          tone={cpuTone}
          value={formatPercent(latest?.cpuUsagePercent)}
        />
        <SystemMetricCard
          helper={`${formatBytes(latest?.memoryUsedBytes)} used of ${formatBytes(latest?.memoryMaxBytes)}`}
          icon={HardDrive}
          label="Memory usage"
          tone={memoryTone}
          value={formatPercent(latest?.memoryUsagePercent)}
        />
        <SystemMetricCard
          helper="Live JVM threads"
          icon={Users}
          label="Threads"
          value={formatNumber(latest?.liveThreads)}
        />
        <SystemMetricCard
          helper="Backend process uptime"
          icon={Timer}
          label="Uptime"
          tone="success"
          value={formatDuration(latest?.uptimeSeconds)}
        />
      </section>

      <div className="dashboard-page__grid">
        <Card className="system-chart-card">
          <div className="system-chart-card__header">
            <div>
              <h3>CPU and memory history</h3>
              <p>Metric cards and charts update when each WebSocket message arrives.</p>
            </div>
            <Activity size={20} aria-hidden="true" />
          </div>
          <div className="system-chart-card__surface">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="label" minTickGap={28} />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Area dataKey="cpuUsagePercent" fill="#0f6b5f" fillOpacity={0.16} name="CPU" stroke="#0f6b5f" strokeWidth={2} />
                <Area dataKey="memoryUsagePercent" fill="#b42318" fillOpacity={0.12} name="Memory" stroke="#b42318" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="system-chart-card">
          <div className="system-chart-card__header">
            <div>
              <h3>Thread history</h3>
              <p>Server-side runtime pressure over the latest WebSocket samples.</p>
            </div>
            <Server size={20} aria-hidden="true" />
          </div>
          <div className="system-chart-card__surface">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="label" minTickGap={28} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line dataKey="liveThreads" dot={false} name="Threads" stroke="#2563eb" strokeWidth={2} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="system-stream-card">
        <div>
          <Radio size={18} aria-hidden="true" />
          <span>Last payload</span>
        </div>
        <pre>{JSON.stringify(latest, null, 2)}</pre>
      </Card>
    </div>
  );
}

function ConnectionBadge({ status }: { status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' }) {
  const tone = status === 'connected' ? 'success' : status === 'reconnecting' ? 'warning' : 'neutral';
  return <Badge tone={tone}>{status}</Badge>;
}

function toneForPercent(value: number) {
  if (value >= 90) {
    return 'critical';
  }

  if (value >= 75) {
    return 'warning';
  }

  return 'default';
}

function formatPercent(value?: number) {
  return typeof value === 'number' ? `${value.toFixed(1)}%` : 'pending';
}

function formatNumber(value?: number) {
  return typeof value === 'number' ? value.toLocaleString('en-US') : 'pending';
}

function formatBytes(value?: number) {
  if (!value) {
    return 'pending';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let nextValue = value;
  let unitIndex = 0;

  while (nextValue >= 1024 && unitIndex < units.length - 1) {
    nextValue /= 1024;
    unitIndex += 1;
  }

  return `${nextValue.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDuration(value?: number) {
  if (typeof value !== 'number') {
    return 'pending';
  }

  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}
