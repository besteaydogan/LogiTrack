import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { Alert, AlertSeverity } from '@/types/logistics';

import './RecentAlerts.css';

type RecentAlertsProps = {
  alerts: Alert[];
};

const severityTone: Record<AlertSeverity, 'info' | 'warning' | 'critical'> = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'warning',
  CRITICAL: 'critical',
};

export function RecentAlerts({ alerts }: RecentAlertsProps) {
  return (
    <Card>
      <ul className="recent-alerts" aria-label="Recent alerts">
        {alerts.map((alert) => (
          <li key={alert.id} className="recent-alerts__item">
            <div className="recent-alerts__content">
              <div className="recent-alerts__meta">
                <Badge tone={severityTone[alert.severity]}>{alert.severity}</Badge>
                <span>{alert.alertType.replace(/_/g, ' ')}</span>
              </div>
              <p>{alert.message}</p>
              <span className="recent-alerts__region">{alert.region ?? 'Region pending'}</span>
            </div>
            <time dateTime={alert.createdAt}>
              {new Intl.DateTimeFormat('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(alert.createdAt))}
            </time>
          </li>
        ))}
      </ul>
    </Card>
  );
}
