import type { LucideIcon } from 'lucide-react';

import { Card } from '@/components/ui/Card';

import './SystemMetricCard.css';

type SystemMetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
  tone?: 'default' | 'warning' | 'critical' | 'success';
};

export function SystemMetricCard({ helper, icon: Icon, label, tone = 'default', value }: SystemMetricCardProps) {
  return (
    <Card className={`system-metric-card system-metric-card--${tone}`}>
      <div className="system-metric-card__icon" aria-hidden="true">
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{helper}</span>
      </div>
    </Card>
  );
}
