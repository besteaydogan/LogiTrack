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
