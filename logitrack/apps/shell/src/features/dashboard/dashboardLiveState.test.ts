import type { DashboardSummaryResponse, LiveFleetEvent } from '@/types/logistics';

import {
  applyDashboardLiveEvent,
  applyDashboardSummaryLiveEvent,
  createInitialDashboardLiveState,
} from './dashboardLiveState';

const summary: DashboardSummaryResponse = {
  totalDeliveries: 10,
  activeDeliveries: 4,
  delayedDeliveries: 1,
  completedDeliveries: 5,
  activeVehicles: 3,
  activeAlerts: 1,
  statusSummary: [
    { status: 'CREATED', count: 1 },
    { status: 'ASSIGNED', count: 1 },
    { status: 'IN_TRANSIT', count: 2 },
    { status: 'DELAYED', count: 1 },
    { status: 'DELIVERED', count: 5 },
    { status: 'CANCELLED', count: 0 },
  ],
  recentAlerts: [],
  processedRecords: 10,
  totalRecords: 5000,
  simulationIntervalSeconds: 5,
};

function event(overrides: Partial<LiveFleetEvent>): LiveFleetEvent {
  return {
    eventType: 'delivery.created',
    vehicleId: 'VHL-KGL-001',
    deliveryId: 'DLV-KGL-001',
    alertId: null,
    region: 'Ankara-Cankaya',
    latitude: null,
    longitude: null,
    status: 'CREATED',
    speed: null,
    delayMinutes: null,
    severity: null,
    message: 'Delivery DLV-KGL-001 replayed from CSV.',
    timestamp: '2026-05-29T09:00:00Z',
    sequence: 1,
    ...overrides,
  } as LiveFleetEvent;
}

describe('dashboard live state', () => {
  it('keeps chart points bounded to the requested window', () => {
    let state = createInitialDashboardLiveState(summary);

    for (let index = 0; index < 5; index += 1) {
      state = applyDashboardLiveEvent(state, event({
        sequence: index,
        timestamp: `2026-05-29T09:00:0${index}Z`,
      }), 3);
    }

    expect(state.chartPoints).toHaveLength(3);
    expect(state.chartPoints[0].timestamp).toBe('2026-05-29T09:00:02Z');
  });

  it('prepends alert.created events to recent alerts', () => {
    const state = applyDashboardLiveEvent(createInitialDashboardLiveState(summary), event({
      eventType: 'alert.created',
      alertId: 'ALT-CSV-000001',
      deliveryId: 'DLV-KGL-001',
      severity: 'HIGH',
      message: 'Delivery DLV-KGL-001 is delayed by 30 minutes.',
      status: null,
    }));

    expect(state.recentAlerts[0]).toMatchObject({
      id: 'ALT-CSV-000001',
      severity: 'HIGH',
      region: 'Ankara-Cankaya',
      status: 'UNRESOLVED',
    });
  });

  it('updates status and region counters from delayed events', () => {
    const state = applyDashboardLiveEvent(createInitialDashboardLiveState(summary), event({
      eventType: 'delivery.delayed',
      status: 'DELAYED',
      delayMinutes: 24,
      severity: 'MEDIUM',
    }));

    expect(state.statusSummary.find((item) => item.status === 'DELAYED')?.count).toBe(2);
    expect(state.regionMetrics[0]).toMatchObject({
      region: 'Ankara-Cankaya',
      delayed: 1,
      events: 1,
    });
  });

  it('patches dashboard summary for alert and delivery events', () => {
    const withDelivery = applyDashboardSummaryLiveEvent(summary, event({}));
    const withAlert = applyDashboardSummaryLiveEvent(withDelivery, event({
      eventType: 'alert.created',
      alertId: 'ALT-CSV-000001',
      severity: 'CRITICAL',
      status: null,
    }));

    expect(withDelivery.totalDeliveries).toBe(11);
    expect(withDelivery.activeDeliveries).toBe(5);
    expect(withAlert.activeAlerts).toBe(2);
    expect(withAlert.recentAlerts[0].id).toBe('ALT-CSV-000001');
  });
});
