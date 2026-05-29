export type DeliveryStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELAYED'
  | 'DELIVERED'
  | 'CANCELLED';

export type DeliveryPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'RESOLVED' | 'UNRESOLVED';

export type VehicleStatus = 'ACTIVE' | 'IDLE' | 'MAINTENANCE' | 'OFFLINE';

export type VehicleSummary = {
  id: string;
  plate: string;
};

export type DriverSummary = {
  id: string;
  name: string;
};

export type WarehouseSummary = {
  id: string;
  name: string;
};

export type Warehouse = {
  id: string;
  name: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  capacity: number;
};

export type Alert = {
  id: string;
  alertType: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  deliveryId: string | null;
  vehicleId: string | null;
  region?: string;
  createdAt: string;
  resolvedAt: string | null;
};

export type Vehicle = {
  id: string;
  plate: string;
  type: string;
  capacity: number;
  status: VehicleStatus;
  currentDriver: DriverSummary | null;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastSeenAt: string | null;
};

export type Delivery = {
  id: string;
  trackingNumber: string;
  status: DeliveryStatus;
  priority: DeliveryPriority;
  region: string;
  vehicle: VehicleSummary;
  driver: DriverSummary;
  warehouse: WarehouseSummary;
  estimatedDeliveryTime: string;
  actualDeliveryTime: string | null;
  delayMinutes: number;
  lastUpdatedAt: string;
};

export type StatusSummaryItem = {
  status: DeliveryStatus;
  count: number;
};

export type DashboardSummaryResponse = {
  totalDeliveries: number;
  activeDeliveries: number;
  delayedDeliveries: number;
  completedDeliveries: number;
  activeVehicles: number;
  activeAlerts: number;
  statusSummary: StatusSummaryItem[];
  recentAlerts: Alert[];
  processedRecords: number;
  totalRecords: number;
  simulationIntervalSeconds: number;
};

export type DeliveryListResponse = {
  items: Delivery[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type AlertListResponse = {
  items: Alert[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type VehicleListResponse = {
  items: Vehicle[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type WarehouseListResponse = {
  items: Warehouse[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type AnalyticsFilters = {
  from?: string;
  to?: string;
  region?: string;
};

export type AnalyticsSummaryMetrics = {
  totalDeliveries: number;
  delayedDeliveries: number;
  averageDelayMinutes: number;
  onTimeRate: number;
};

export type DelayTrendItem = {
  date: string;
  totalDeliveries: number;
  delayedDeliveries: number;
  averageDelayMinutes: number;
};

export type RegionBreakdownItem = {
  region: string;
  totalDeliveries: number;
  delayedDeliveries: number;
  averageDelayMinutes: number;
  delayRate: number;
};

export type DriverPerformanceItem = {
  driverId: string;
  driverName: string;
  totalDeliveries: number;
  delayedDeliveries: number;
  averageDelayMinutes: number;
  onTimeRate: number;
};

export type VehiclePerformanceItem = {
  vehicleId: string;
  plate: string;
  totalDeliveries: number;
  delayedDeliveries: number;
  averageDelayMinutes: number;
  onTimeRate: number;
};

export type AnalyticsSummaryResponse = {
  summary: AnalyticsSummaryMetrics;
  delayTrend: DelayTrendItem[];
  regionBreakdown: RegionBreakdownItem[];
  driverPerformance: DriverPerformanceItem[];
  vehiclePerformance: VehiclePerformanceItem[];
};

export type LiveFleetEventBase = {
  eventType: 'delivery.created' | 'vehicle.location.updated' | 'delivery.status.changed' | 'delivery.delayed' | 'alert.created';
  vehicleId: string | null;
  deliveryId: string | null;
  alertId: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string | null;
  speed: number | null;
  delayMinutes: number | null;
  severity: AlertSeverity | null;
  message: string;
  timestamp: string;
  sequence: number | null;
  simulationRunId: string | null;
  processedRecords: number | null;
  totalRecords: number | null;
  simulationIntervalSeconds: number | null;
  trackingNumber?: string | null;
  driverId?: string | null;
  warehouseId?: string | null;
  priority?: DeliveryPriority | null;
  estimatedDeliveryTime?: string | null;
  actualDeliveryTime?: string | null;
};

export type DeliveryCreatedEvent = LiveFleetEventBase & {
  eventType: 'delivery.created';
  deliveryId: string;
  vehicleId: string;
  status: DeliveryStatus;
};

export type VehicleLocationUpdatedEvent = LiveFleetEventBase & {
  eventType: 'vehicle.location.updated';
  vehicleId: string;
  latitude: number;
  longitude: number;
  status: VehicleStatus;
  speed: number;
};

export type DeliveryStatusChangedEvent = LiveFleetEventBase & {
  eventType: 'delivery.status.changed';
  deliveryId: string;
  status: DeliveryStatus;
};

export type DeliveryDelayedEvent = LiveFleetEventBase & {
  eventType: 'delivery.delayed';
  deliveryId: string;
  delayMinutes: number;
  severity: AlertSeverity;
  status: 'DELAYED';
};

export type AlertCreatedEvent = LiveFleetEventBase & {
  eventType: 'alert.created';
  alertId: string;
  severity: AlertSeverity;
};

export type LiveFleetEvent =
  | DeliveryCreatedEvent
  | VehicleLocationUpdatedEvent
  | DeliveryStatusChangedEvent
  | DeliveryDelayedEvent
  | AlertCreatedEvent;
