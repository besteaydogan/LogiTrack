import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card } from '@/components/ui/Card';

import type { LiveEventChartPoint } from './dashboardLiveState';
import './LiveEventsOverTime.css';

type LiveEventsOverTimeProps = {
  data: LiveEventChartPoint[];
};

export function LiveEventsOverTime({ data }: LiveEventsOverTimeProps) {
  return (
    <Card className="live-events-chart">
      <div className="live-events-chart__surface" aria-label="Live events over time chart">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 14, bottom: 8, left: -18 }}>
            <CartesianGrid stroke="#e4edf5" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={18} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip
              labelFormatter={(_, payload) => payload?.[0]?.payload?.timestamp ?? ''}
              cursor={{ stroke: '#8fb6cf' }}
            />
            <Line type="monotone" dataKey="events" stroke="#0f5d8f" strokeWidth={2} dot={false} name="Events" />
            <Line type="monotone" dataKey="delayed" stroke="#c47a11" strokeWidth={2} dot={false} name="Delayed" />
            <Line type="monotone" dataKey="alerts" stroke="#b42318" strokeWidth={2} dot={false} name="Alerts" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {data.length === 0 ? (
        <p className="live-events-chart__empty">Waiting for live events.</p>
      ) : null}
    </Card>
  );
}
