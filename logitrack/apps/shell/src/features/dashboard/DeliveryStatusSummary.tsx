import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card } from '@/components/ui/Card';
import type { StatusSummaryItem } from '@/types/logistics';

import './DeliveryStatusSummary.css';

type DeliveryStatusSummaryProps = {
  data: StatusSummaryItem[];
};

export function DeliveryStatusSummary({ data }: DeliveryStatusSummaryProps) {
  return (
    <Card className="status-summary">
      <div className="status-summary__chart" aria-label="Delivery status summary chart">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -18 }}>
            <CartesianGrid stroke="#e4edf5" vertical={false} />
            <XAxis dataKey="status" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: '#edf6fd' }} />
            <Bar dataKey="count" fill="#0f5d8f" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="status-summary__legend">
        {data.map((item) => (
          <span key={item.status}>
            <strong>{item.count}</strong> {item.status.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    </Card>
  );
}
