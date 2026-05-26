import type {
  AlertListResponse,
  DashboardSummaryResponse,
  DeliveryListResponse,
} from '@/types/logistics';

export const dashboardSummary: DashboardSummaryResponse = {
  totalDeliveries: 128,
  activeDeliveries: 46,
  delayedDeliveries: 9,
  completedDeliveries: 73,
  activeVehicles: 32,
  activeAlerts: 6,
  statusSummary: [
    { status: 'CREATED', count: 12 },
    { status: 'IN_TRANSIT', count: 34 },
    { status: 'DELAYED', count: 9 },
    { status: 'DELIVERED', count: 73 },
  ],
  recentAlerts: [
    {
      id: 'ALT-9001',
      severity: 'HIGH',
      status: 'UNRESOLVED',
      alertType: 'DELIVERY_DELAY',
      message: 'Delivery DLV-5018 is delayed by 17 minutes.',
      deliveryId: 'DLV-5018',
      vehicleId: 'VHL-018',
      region: 'Ankara-Cankaya',
      createdAt: '2026-05-20T21:15:30Z',
      resolvedAt: null,
    },
    {
      id: 'ALT-9002',
      severity: 'CRITICAL',
      status: 'UNRESOLVED',
      alertType: 'VEHICLE_OFFLINE',
      message: 'Vehicle VHL-027 has not reported location for 12 minutes.',
      deliveryId: null,
      vehicleId: 'VHL-027',
      region: 'Istanbul-Kadikoy',
      createdAt: '2026-05-20T21:19:00Z',
      resolvedAt: null,
    },
    {
      id: 'ALT-9003',
      severity: 'LOW',
      status: 'UNRESOLVED',
      alertType: 'ROUTE_UPDATED',
      message: 'Route updated for delivery DLV-5031 due to traffic density.',
      deliveryId: 'DLV-5031',
      vehicleId: 'VHL-031',
      region: 'Izmir-Konak',
      createdAt: '2026-05-20T21:24:00Z',
      resolvedAt: null,
    },
  ],
};

export const deliveries: DeliveryListResponse = {
  items: [
    {
      id: 'DLV-5018',
      trackingNumber: 'TRK-2026-5018',
      status: 'DELAYED',
      priority: 'HIGH',
      region: 'Ankara-Cankaya',
      vehicle: {
        id: 'VHL-018',
        plate: '06 LGT 018',
      },
      driver: {
        id: 'DRV-044',
        name: 'Ayse Demir',
      },
      warehouse: {
        id: 'WH-ANK-01',
        name: 'Ankara Main Hub',
      },
      estimatedDeliveryTime: '2026-05-20T21:00:00Z',
      actualDeliveryTime: null,
      delayMinutes: 17,
      lastUpdatedAt: '2026-05-20T21:17:00Z',
    },
    {
      id: 'DLV-5031',
      trackingNumber: 'TRK-2026-5031',
      status: 'IN_TRANSIT',
      priority: 'NORMAL',
      region: 'Izmir-Konak',
      vehicle: {
        id: 'VHL-031',
        plate: '35 LGT 031',
      },
      driver: {
        id: 'DRV-019',
        name: 'Mert Kaya',
      },
      warehouse: {
        id: 'WH-IZM-01',
        name: 'Izmir Coastal Hub',
      },
      estimatedDeliveryTime: '2026-05-20T22:30:00Z',
      actualDeliveryTime: null,
      delayMinutes: 0,
      lastUpdatedAt: '2026-05-20T21:22:00Z',
    },
  ],
  page: 1,
  pageSize: 20,
  totalItems: 128,
  totalPages: 7,
};

export const alerts: AlertListResponse = {
  items: dashboardSummary.recentAlerts,
  page: 1,
  pageSize: 20,
  totalItems: dashboardSummary.activeAlerts,
  totalPages: 1,
};
