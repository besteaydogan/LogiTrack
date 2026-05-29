import { useEffect, useSyncExternalStore } from 'react';

import { subscribeToFleetEvents } from '@/services/api/live';
import type {
  Alert,
  AlertListResponse,
  DashboardSummaryResponse,
  Delivery,
  DeliveryListResponse,
  DeliveryStatus,
  LiveFleetEvent,
  StatusSummaryItem,
  Vehicle,
  VehicleListResponse,
} from '@/types/logistics';

export type LiveConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export type LiveChartPoint = {
  timestamp: string;
  label: string;
  events: number;
  delayed: number;
  alerts: number;
};

export type LiveOperationsState = {
  connectionState: LiveConnectionState;
  lastEvent: LiveFleetEvent | null;
  processedRecords: number;
  totalRecords: number;
  simulationIntervalSeconds: number;
  summary: DashboardSummaryResponse;
  deliveries: Delivery[];
  alerts: Alert[];
  vehicles: Vehicle[];
  chartPoints: LiveChartPoint[];
};

const DELIVERY_STATUSES: DeliveryStatus[] = ['CREATED', 'ASSIGNED', 'IN_TRANSIT', 'DELAYED', 'DELIVERED', 'CANCELLED'];
const MAX_CHART_POINTS = 60;
const MAX_RECENT_ALERTS = 5;

let state: LiveOperationsState = {
  connectionState: 'connecting',
  lastEvent: null,
  processedRecords: 0,
  totalRecords: 0,
  simulationIntervalSeconds: 5,
  summary: emptySummary(),
  deliveries: [],
  alerts: [],
  vehicles: [],
  chartPoints: [],
};

const subscribers = new Set<() => void>();
let unsubscribeLiveEvents: (() => void) | null = null;

export function useLiveOperationsStream(seed?: {
  summary?: DashboardSummaryResponse;
  deliveries?: DeliveryListResponse;
  alerts?: AlertListResponse;
  vehicles?: VehicleListResponse;
}) {
  useEffect(() => {
    seedState(seed);
  }, [seed?.summary, seed?.deliveries, seed?.alerts, seed?.vehicles]);

  useEffect(() => {
    ensureLiveSource();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  ensureLiveSource();

  return () => {
    subscribers.delete(callback);
  };
}

function getSnapshot() {
  return state;
}

function emit(next: LiveOperationsState) {
  state = next;
  subscribers.forEach((callback) => callback());
}

function seedState(seed?: {
  summary?: DashboardSummaryResponse;
  deliveries?: DeliveryListResponse;
  alerts?: AlertListResponse;
  vehicles?: VehicleListResponse;
}) {
  if (!seed) {
    return;
  }

  emit({
    ...state,
    summary: seed.summary ?? state.summary,
    processedRecords: seed.summary?.processedRecords ?? state.processedRecords,
    totalRecords: seed.summary?.totalRecords ?? state.totalRecords,
    simulationIntervalSeconds: seed.summary?.simulationIntervalSeconds ?? state.simulationIntervalSeconds,
    deliveries: mergeById(seed.deliveries?.items, state.deliveries),
    alerts: mergeById(seed.alerts?.items, state.alerts),
    vehicles: mergeById(seed.vehicles?.items, state.vehicles),
  });
}

function ensureLiveSource() {
  if (unsubscribeLiveEvents) {
    return;
  }

  unsubscribeLiveEvents = subscribeToFleetEvents({
    onError: () => {
      emit({ ...state, connectionState: state.connectionState === 'connected' ? 'reconnecting' : 'disconnected' });
    },
    onMessage: applyLiveEvent,
    onOpen: () => {
      emit({ ...state, connectionState: 'connected' });
    },
  });
}

function applyLiveEvent(event: LiveFleetEvent) {
  const withProgress = {
    ...state,
    connectionState: 'connected' as const,
    lastEvent: event,
    processedRecords: event.processedRecords ?? state.processedRecords,
    totalRecords: event.totalRecords ?? state.totalRecords,
    simulationIntervalSeconds: event.simulationIntervalSeconds ?? state.simulationIntervalSeconds,
    chartPoints: appendChartPoint(state.chartPoints, event),
  };

  if (event.eventType === 'delivery.created') {
    const delivery = deliveryFromEvent(event);
    const deliveries = [delivery, ...withProgress.deliveries.filter((item) => item.id !== delivery.id)];
    emit({
      ...withProgress,
      deliveries,
      summary: recomputeSummary(deliveries, withProgress.alerts, withProgress.vehicles),
    });
    return;
  }

  if (event.eventType === 'delivery.status.changed') {
    const deliveries = withProgress.deliveries.map((delivery) => delivery.id === event.deliveryId ? {
      ...delivery,
      status: event.status,
      actualDeliveryTime: event.status === 'DELIVERED' ? event.timestamp : delivery.actualDeliveryTime,
      lastUpdatedAt: event.timestamp,
    } : delivery);
    emit({
      ...withProgress,
      deliveries,
      summary: recomputeSummary(deliveries, withProgress.alerts, withProgress.vehicles),
    });
    return;
  }

  if (event.eventType === 'delivery.delayed') {
    const deliveries = withProgress.deliveries.map((delivery) => delivery.id === event.deliveryId ? {
      ...delivery,
      status: 'DELAYED' as const,
      delayMinutes: Math.max(delivery.delayMinutes, event.delayMinutes),
      lastUpdatedAt: event.timestamp,
    } : delivery);
    emit({
      ...withProgress,
      deliveries,
      summary: recomputeSummary(deliveries, withProgress.alerts, withProgress.vehicles),
    });
    return;
  }

  if (event.eventType === 'alert.created') {
    const alert = alertFromEvent(event);
    const alerts = [alert, ...withProgress.alerts.filter((item) => item.id !== alert.id)];
    emit({
      ...withProgress,
      alerts,
      summary: recomputeSummary(withProgress.deliveries, alerts, withProgress.vehicles),
    });
    return;
  }

  if (event.eventType === 'vehicle.location.updated') {
    const vehicle = vehicleFromEvent(event);
    const vehicles = [vehicle, ...withProgress.vehicles.filter((item) => item.id !== vehicle.id)];
    emit({
      ...withProgress,
      vehicles,
      summary: recomputeSummary(withProgress.deliveries, withProgress.alerts, vehicles),
    });
  }
}

function deliveryFromEvent(event: LiveFleetEvent): Delivery {
  return {
    id: event.deliveryId ?? `delivery-${event.sequence ?? event.timestamp}`,
    trackingNumber: event.trackingNumber ?? event.deliveryId ?? 'pending',
    status: isDeliveryStatus(event.status) ? event.status : 'CREATED',
    priority: event.priority ?? 'NORMAL',
    region: event.region ?? 'Region pending',
    vehicle: { id: event.vehicleId ?? 'pending', plate: event.vehicleId ?? 'pending' },
    driver: { id: event.driverId ?? 'pending', name: event.driverId ?? 'Driver pending' },
    warehouse: { id: event.warehouseId ?? 'pending', name: event.warehouseId ?? 'Warehouse pending' },
    estimatedDeliveryTime: event.estimatedDeliveryTime ?? event.timestamp,
    actualDeliveryTime: event.actualDeliveryTime ?? null,
    delayMinutes: event.delayMinutes ?? 0,
    lastUpdatedAt: event.timestamp,
  };
}

function alertFromEvent(event: LiveFleetEvent): Alert {
  return {
    id: event.alertId ?? `alert-${event.sequence ?? event.timestamp}`,
    alertType: event.message.toLowerCase().includes('delay') ? 'DELIVERY_DELAY' : 'LIVE_EVENT',
    severity: event.severity ?? 'LOW',
    status: 'UNRESOLVED',
    message: event.message,
    deliveryId: event.deliveryId,
    vehicleId: event.vehicleId,
    region: event.region ?? undefined,
    createdAt: event.timestamp,
    resolvedAt: null,
  };
}

function vehicleFromEvent(event: LiveFleetEvent): Vehicle {
  const existing = state.vehicles.find((vehicle) => vehicle.id === event.vehicleId);
  return {
    id: event.vehicleId ?? 'pending',
    plate: existing?.plate ?? event.vehicleId ?? 'pending',
    type: existing?.type ?? 'Vehicle',
    capacity: existing?.capacity ?? 0,
    status: event.status === 'IDLE' || event.status === 'MAINTENANCE' || event.status === 'OFFLINE' ? event.status : 'ACTIVE',
    currentDriver: existing?.currentDriver ?? null,
    lastLatitude: event.latitude,
    lastLongitude: event.longitude,
    lastSeenAt: event.timestamp,
  };
}

function recomputeSummary(deliveries: Delivery[], alerts: Alert[], vehicles: Vehicle[]): DashboardSummaryResponse {
  const activeStatuses: DeliveryStatus[] = ['CREATED', 'ASSIGNED', 'IN_TRANSIT', 'DELAYED'];
  const statusSummary = DELIVERY_STATUSES.map<StatusSummaryItem>((status) => ({
    status,
    count: deliveries.filter((delivery) => delivery.status === status).length,
  }));

  return {
    totalDeliveries: deliveries.length,
    activeDeliveries: deliveries.filter((delivery) => activeStatuses.includes(delivery.status)).length,
    delayedDeliveries: deliveries.filter((delivery) => delivery.status === 'DELAYED' || delivery.delayMinutes > 0).length,
    completedDeliveries: deliveries.filter((delivery) => delivery.status === 'DELIVERED').length,
    activeVehicles: vehicles.filter((vehicle) => vehicle.lastSeenAt && ['ACTIVE', 'IDLE'].includes(vehicle.status)).length,
    activeAlerts: alerts.filter((alert) => alert.status === 'UNRESOLVED').length,
    statusSummary,
    recentAlerts: alerts.filter((alert) => alert.status === 'UNRESOLVED').slice(0, MAX_RECENT_ALERTS),
    processedRecords: deliveries.length,
    totalRecords: state.totalRecords,
    simulationIntervalSeconds: state.simulationIntervalSeconds,
  };
}

function appendChartPoint(points: LiveChartPoint[], event: LiveFleetEvent) {
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

  return [...points, point].slice(-MAX_CHART_POINTS);
}

function emptySummary(): DashboardSummaryResponse {
  return {
    totalDeliveries: 0,
    activeDeliveries: 0,
    delayedDeliveries: 0,
    completedDeliveries: 0,
    activeVehicles: 0,
    activeAlerts: 0,
    statusSummary: DELIVERY_STATUSES.map((status) => ({ status, count: 0 })),
    recentAlerts: [],
    processedRecords: 0,
    totalRecords: 0,
    simulationIntervalSeconds: 5,
  };
}

function isDeliveryStatus(status: string | null): status is DeliveryStatus {
  return DELIVERY_STATUSES.includes(status as DeliveryStatus);
}

function mergeById<T extends { id: string }>(seedItems: T[] | undefined, currentItems: T[]) {
  if (!seedItems) {
    return currentItems;
  }

  const currentById = new Map(currentItems.map((item) => [item.id, item]));
  const merged = seedItems.map((item) => currentById.get(item.id) ?? item);
  const seedIds = new Set(seedItems.map((item) => item.id));
  return [...currentItems.filter((item) => !seedIds.has(item.id)), ...merged];
}
