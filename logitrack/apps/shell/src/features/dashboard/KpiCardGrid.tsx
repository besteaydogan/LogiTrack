import { AlertTriangle, CheckCircle2, Clock, Package, PackageCheck, Truck } from 'lucide-react';

import type { DashboardSummaryResponse } from '@/types/logistics';

import { KpiCard } from './KpiCard';
import './KpiCardGrid.css';

type KpiCardGridProps = {
  summary: DashboardSummaryResponse;
};

export function KpiCardGrid({ summary }: KpiCardGridProps) {
  return (
    <div className="kpi-grid">
      <KpiCard
        label="Processed deliveries"
        value={`${summary.totalDeliveries} / ${summary.totalRecords || summary.totalDeliveries}`}
        helper="Replay progress in the current live simulation"
        icon={Package}
      />
      <KpiCard
        label="Active deliveries"
        value={summary.activeDeliveries}
        helper="Deliveries moving through the operation"
        icon={Clock}
      />
      <KpiCard
        label="Delayed deliveries"
        value={summary.delayedDeliveries}
        helper="Need operational attention"
        icon={AlertTriangle}
        tone="warning"
      />
      <KpiCard
        label="Completed"
        value={summary.completedDeliveries}
        helper="Delivered successfully"
        icon={CheckCircle2}
        tone="success"
      />
      <KpiCard
        label="Active vehicles"
        value={summary.activeVehicles}
        helper="Vehicles reporting active status"
        icon={Truck}
      />
      <KpiCard
        label="Active alerts"
        value={summary.activeAlerts}
        helper="Unresolved alerts in the control tower"
        icon={PackageCheck}
        tone="critical"
      />
    </div>
  );
}
