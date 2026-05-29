import type { LucideIcon } from 'lucide-react';

import { Card } from '@/components/ui/Card';

import './KpiCard.css';

type KpiCardProps = {
  label: string;
  value: number | string;
  helper: string;
  icon: LucideIcon;
  tone?: 'default' | 'warning' | 'critical' | 'success';
};

export function KpiCard({ label, value, helper, icon: Icon, tone = 'default' }: KpiCardProps) {
  return (
    <Card className={`kpi-card kpi-card--${tone}`}>
      <div className="kpi-card__icon" aria-hidden="true">
        <Icon size={20} />
      </div>
      <div>
        <p className="kpi-card__label">{label}</p>
        <strong>{typeof value === 'number' ? value.toLocaleString('en-US') : value}</strong>
        <span>{helper}</span>
      </div>
    </Card>
  );
}
