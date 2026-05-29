import type {
  Alert,
  DashboardSummaryResponse,
  DeliveryStatus,
  LiveFleetEvent,
  StatusSummaryItem,
} from '@/types/logistics';

export type LiveEventChartPoint = {
  timestamp: string;
  label: string;
  events: number;
  delayed: number;
  alerts: number;
};

export type LiveRegionMetric = {
  region: string;
  deliveries: number;
  delayed: number;
  alerts: number;
  events: number;
};

export type RecentLiveEvent = {
  id: string;
  eventType: LiveFleetEvent['eventType'];
  message: string;
  timestamp: string;
  region: string | null;
};

export type DashboardLiveState = {
  chartPoints: LiveEventChartPoint[];
  recentEvents: RecentLiveEvent[];
  recentAlerts: Alert[];
  regionMetrics: LiveRegionMetric[];
  statusSummary: StatusSummaryItem[];
};

export const MAX_DASHBOARD_CHART_POINTS = 60;
const MAX_RECENT_EVENTS = 12;
const MAX_RECENT_ALERTS = 5;

const DELIVERY_STATUSES: DeliveryStatus[] = [
  'CREATED',
  'ASSIGNED',
  'IN_TRANSIT',
  'DELAYED',
  'DELIVERED',
  'CANCELLED',
];

export function createInitialDashboardLiveState(summary: DashboardSummaryResponse | undefined): DashboardLiveState {
  return {
    chartPoints: [],
    recentEvents: [],
    recentAlerts: summary?.recentAlerts ?? [],
    regionMetrics: buildInitialRegionMetrics(summary?.recentAlerts ?? []),
    statusSummary: normalizeStatusSummary(summary?.statusSummary ?? []),
  };
}

export function applyDashboardLiveEvent(
  current: DashboardLiveState,
  event: LiveFleetEvent,
  maxChartPoints = MAX_DASHBOARD_CHART_POINTS,
): DashboardLiveState {
  return {
    chartPoints: appendChartPoint(current.chartPoints, event, maxChartPoints),
    recentEvents: prependRecentEvent(current.recentEvents, event),
    recentAlerts: updateRecentAlerts(current.recentAlerts, event),
    regionMetrics: updateRegionMetrics(current.regionMetrics, event),
    statusSummary: updateStatusSummary(current.statusSummary, event),
  };
}

export function applyDashboardSummaryLiveEvent(
  summary: DashboardSummaryResponse,
  event: LiveFleetEvent,
): DashboardSummaryResponse {
  const recentAlerts = updateRecentAlerts(summary.recentAlerts, event);
  const statusSummary = updateStatusSummary(summary.statusSummary, event);

  if (event.eventType === 'delivery.created') {
    return {
      ...summary,
      totalDeliveries: summary.totalDeliveries + 1,
      activeDeliveries: summary.activeDeliveries + 1,
      statusSummary,
      recentAlerts,
    };
  }

  if (event.eventType === 'delivery.delayed') {
    return {
      ...summary,
      delayedDeliveries: summary.delayedDeliveries + 1,
      statusSummary,
      recentAlerts,
    };
  }

  if (event.eventType === 'delivery.status.changed' && event.status === 'DELIVERED') {
    return {
      ...summary,
      activeDeliveries: Math.max(0, summary.activeDeliveries - 1),
      completedDeliveries: summary.completedDeliveries + 1,
      statusSummary,
      recentAlerts,
    };
  }

  if (event.eventType === 'alert.created') {
    return {
      ...summary,
      activeAlerts: summary.activeAlerts + 1,
      statusSummary,
      recentAlerts,
    };
  }

  return {
    ...summary,
    statusSummary,
    recentAlerts,
  };
}

function appendChartPoint(
  points: LiveEventChartPoint[],
  event: LiveFleetEvent,
  maxChartPoints: number,
) {
  const point = {
    timestamp: event.timestamp,
    label: new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(event.timestamp)),
    events: 1,
    delayed: event.eventType === 'delivery.delayed' ? 1 : 0,
    alerts: event.eventType === 'alert.created' ? 1 : 0,
  };

  return [...points, point].slice(-maxChartPoints);
}

function prependRecentEvent(events: RecentLiveEvent[], event: LiveFleetEvent) {
  return [
    {
      id: `${event.eventType}-${event.sequence ?? event.timestamp}-${event.deliveryId ?? event.vehicleId ?? event.alertId ?? 'event'}`,
      eventType: event.eventType,
      message: event.message,
      timestamp: event.timestamp,
      region: event.region,
    },
    ...events,
  ].slice(0, MAX_RECENT_EVENTS);
}

function updateRecentAlerts(alerts: Alert[], event: LiveFleetEvent) {
  if (event.eventType !== 'alert.created') {
    return alerts;
  }

  const alert: Alert = {
    id: event.alertId,
    alertType: event.message.toLowerCase().includes('delay') ? 'DELIVERY_DELAY' : 'LIVE_EVENT',
    severity: event.severity,
    status: 'UNRESOLVED',
    message: event.message,
    deliveryId: event.deliveryId,
    vehicleId: event.vehicleId,
    region: event.region ?? undefined,
    createdAt: event.timestamp,
    resolvedAt: null,
  };

  return [alert, ...alerts.filter((item) => item.id !== alert.id)].slice(0, MAX_RECENT_ALERTS);
}

function updateRegionMetrics(metrics: LiveRegionMetric[], event: LiveFleetEvent) {
  if (!event.region) {
    return metrics;
  }

  const existing = metrics.find((metric) => metric.region === event.region) ?? {
    region: event.region,
    deliveries: 0,
    delayed: 0,
    alerts: 0,
    events: 0,
  };
  const nextMetric = {
    ...existing,
    deliveries: existing.deliveries + (event.eventType === 'delivery.created' || event.eventType === 'delivery.status.changed' ? 1 : 0),
    delayed: existing.delayed + (event.eventType === 'delivery.delayed' ? 1 : 0),
    alerts: existing.alerts + (event.eventType === 'alert.created' ? 1 : 0),
    events: existing.events + 1,
  };

  return [
    nextMetric,
    ...metrics.filter((metric) => metric.region !== event.region),
  ].sort((first, second) => second.events - first.events || first.region.localeCompare(second.region));
}

function updateStatusSummary(statusSummary: StatusSummaryItem[], event: LiveFleetEvent) {
  const normalized = normalizeStatusSummary(statusSummary);

  if (event.eventType === 'delivery.created' && isDeliveryStatus(event.status)) {
    return incrementStatus(normalized, event.status, 1);
  }

  if (event.eventType === 'delivery.delayed') {
    return incrementStatus(normalized, 'DELAYED', 1);
  }

  if (event.eventType === 'delivery.status.changed' && isDeliveryStatus(event.status)) {
    return incrementStatus(normalized, event.status, 1);
  }

  return normalized;
}

function normalizeStatusSummary(statusSummary: StatusSummaryItem[]) {
  return DELIVERY_STATUSES.map((status) => ({
    status,
    count: statusSummary.find((item) => item.status === status)?.count ?? 0,
  }));
}

function incrementStatus(statusSummary: StatusSummaryItem[], status: DeliveryStatus, increment: number) {
  return statusSummary.map((item) => item.status === status ? {
    ...item,
    count: item.count + increment,
  } : item);
}

function isDeliveryStatus(status: string | null): status is DeliveryStatus {
  return DELIVERY_STATUSES.includes(status as DeliveryStatus);
}

function buildInitialRegionMetrics(alerts: Alert[]) {
  return alerts.reduce<LiveRegionMetric[]>((metrics, alert) => {
    if (!alert.region) {
      return metrics;
    }

    return updateRegionMetrics(metrics, {
      eventType: 'alert.created',
      vehicleId: alert.vehicleId,
      deliveryId: alert.deliveryId,
      alertId: alert.id,
      region: alert.region,
      latitude: null,
      longitude: null,
      status: null,
      speed: null,
      delayMinutes: null,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.createdAt,
      sequence: null,
      simulationRunId: null,
      processedRecords: null,
      totalRecords: null,
      simulationIntervalSeconds: null,
    });
  }, []);
}
