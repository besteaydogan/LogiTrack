import type { Alert, Delivery, DeliveryStatus, RegionBreakdownItem, Vehicle, Warehouse } from '@logitrack/types';

export type ScenePosition = [number, number, number];

export type Fleet3DLayerKey = 'regions' | 'vehicles' | 'warehouses' | 'routes' | 'alerts';

export type Fleet3DSelection =
  | { type: 'region'; item: Fleet3DRegion }
  | { type: 'vehicle'; item: Fleet3DVehicle }
  | { type: 'warehouse'; item: Fleet3DWarehouse }
  | { type: 'route'; item: Fleet3DRoute }
  | null;

export type Fleet3DRegion = RegionBreakdownItem & {
  position: ScenePosition;
  footprint: number;
  height: number;
};

export type Fleet3DVehicle = Vehicle & {
  position: ScenePosition;
};

export type Fleet3DWarehouse = Warehouse & {
  position: ScenePosition;
  height: number;
};

export type Fleet3DRoute = {
  id: string;
  delivery: Delivery;
  color: string;
  end: ScenePosition;
  start: ScenePosition;
  status: DeliveryStatus;
};

export type Fleet3DAlertPulse = {
  id: string;
  alert: Alert;
  createdAt: string;
  position: ScenePosition;
};

export type Fleet3DSceneData = {
  alerts: Fleet3DAlertPulse[];
  regions: Fleet3DRegion[];
  routes: Fleet3DRoute[];
  vehicles: Fleet3DVehicle[];
  warehouses: Fleet3DWarehouse[];
  stats: {
    totalAlerts: number;
    totalRoutes: number;
    totalVehicles: number;
    totalWarehouses: number;
  };
};

export type Fleet3DLayerState = Record<Fleet3DLayerKey, boolean>;

export type Fleet3DStatusFilters = Record<DeliveryStatus, boolean>;
