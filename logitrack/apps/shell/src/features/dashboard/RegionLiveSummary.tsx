import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card } from '@/components/ui/Card';

import type { LiveRegionMetric } from './dashboardLiveState';
import './RegionLiveSummary.css';

type RegionLiveSummaryProps = {
  data: LiveRegionMetric[];
};

export function RegionLiveSummary({ data }: RegionLiveSummaryProps) {
  const chartData = data.slice(0, 8);
  const shortRegion = (region: string) => region.length > 12 ? `${region.slice(0, 11)}.` : region;

  return (
    <Card className="region-live-summary">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -18 }}>
          <CartesianGrid stroke="#e4edf5" vertical={false} />
          <XAxis dataKey="region" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={shortRegion} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: '#edf6fd' }} />
          <Bar dataKey="events" fill="#0f5d8f" radius={[6, 6, 0, 0]} name="Events" />
          <Bar dataKey="delayed" fill="#c47a11" radius={[6, 6, 0, 0]} name="Delayed" />
          <Bar dataKey="alerts" fill="#b42318" radius={[6, 6, 0, 0]} name="Alerts" />
        </BarChart>
      </ResponsiveContainer>
      {chartData.length === 0 ? <p className="region-live-summary__empty">Waiting for regional live events.</p> : null}
    </Card>
  );
}
