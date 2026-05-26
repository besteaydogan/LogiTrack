import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAnalyticsSummaryGraphql,
  getDeliveries,
  getVehicles,
  getWarehouses,
  queryKeys,
} from '@logitrack/api-client';
import type { DeliveryStatus } from '@logitrack/types';

import type {
  Fleet3DRegion,
  Fleet3DRoute,
  Fleet3DSceneData,
  Fleet3DStatusFilters,
  Fleet3DVehicle,
  Fleet3DWarehouse,
} from '../types/fleet3d.types';
import { getRegionBlockFootprint, getRegionBlockHeight, getWarehouseNodeHeight } from '../utils/getRegionBlockHeight';
import { getRouteColor } from '../utils/getRouteColor';
import { getRegionScenePosition, mapLatLngToScenePosition } from '../utils/mapLatLngToScenePosition';

const MAX_REGIONS = 50;
const MAX_VEHICLES = 200;
const MAX_WAREHOUSES = 50;
const MAX_ROUTES = 250;

const defaultAnalyticsFilters = {
  from: '2026-05-01',
  to: '2026-05-25',
  region: undefined,
};

const activeStatusWeight: Record<DeliveryStatus, number> = {
  DELAYED: 6,
  IN_TRANSIT: 5,
  ASSIGNED: 4,
  CREATED: 3,
  DELIVERED: 2,
  CANCELLED: 1,
};

export function useFleet3DData(statusFilters: Fleet3DStatusFilters) {
  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: getVehicles,
    refetchInterval: 5000,
  });
  const deliveriesQuery = useQuery({
    queryKey: queryKeys.deliveries,
    queryFn: getDeliveries,
    refetchInterval: 10000,
  });
  const warehousesQuery = useQuery({
    queryKey: queryKeys.warehouses,
    queryFn: getWarehouses,
  });
  const analyticsQuery = useQuery({
    queryKey: queryKeys.analyticsSummary(defaultAnalyticsFilters),
    queryFn: () => getAnalyticsSummaryGraphql(defaultAnalyticsFilters),
  });

  const sceneData = useMemo<Fleet3DSceneData>(() => {
    const vehicles = (vehiclesQuery.data?.items ?? [])
      .filter((vehicle) => vehicle.lastLatitude !== null && vehicle.lastLongitude !== null)
      .sort((first, second) => vehiclePriority(second) - vehiclePriority(first))
      .slice(0, MAX_VEHICLES)
      .map<Fleet3DVehicle>((vehicle) => ({
        ...vehicle,
        position: mapLatLngToScenePosition(vehicle.lastLatitude ?? 0, vehicle.lastLongitude ?? 0, 0.45),
      }));

    const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

    const warehouses = (warehousesQuery.data?.items ?? [])
      .slice(0, MAX_WAREHOUSES)
      .map<Fleet3DWarehouse>((warehouse) => {
        const height = getWarehouseNodeHeight(warehouse.capacity);

        return {
          ...warehouse,
          height,
          position: mapLatLngToScenePosition(warehouse.latitude, warehouse.longitude, height / 2),
        };
      });

    const warehouseById = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]));

    const regions = (analyticsQuery.data?.regionBreakdown ?? [])
      .sort((first, second) => second.delayRate - first.delayRate || second.totalDeliveries - first.totalDeliveries)
      .slice(0, MAX_REGIONS)
      .map<Fleet3DRegion>((region) => {
        const height = getRegionBlockHeight(region.delayRate);

        return {
          ...region,
          footprint: getRegionBlockFootprint(region.totalDeliveries),
          height,
          position: getRegionScenePosition(region.region, height / 2),
        };
      });

    const routes = (deliveriesQuery.data?.items ?? [])
      .filter((delivery) => statusFilters[delivery.status])
      .sort((first, second) => (
        activeStatusWeight[second.status] - activeStatusWeight[first.status]
        || new Date(second.lastUpdatedAt).getTime() - new Date(first.lastUpdatedAt).getTime()
      ))
      .map<Fleet3DRoute | null>((delivery) => {
        const warehouse = warehouseById.get(delivery.warehouse.id);

        if (!warehouse) {
          return null;
        }

        const vehicle = vehicleById.get(delivery.vehicle.id);
        const shouldUseVehicle = delivery.status === 'IN_TRANSIT' || delivery.status === 'DELAYED';
        const end = shouldUseVehicle && vehicle ? vehicle.position : getRegionScenePosition(delivery.region, 0.2);

        return {
          id: delivery.id,
          delivery,
          status: delivery.status,
          color: getRouteColor(delivery.status),
          start: [warehouse.position[0], warehouse.height + 0.1, warehouse.position[2]],
          end,
        };
      })
      .filter((route): route is Fleet3DRoute => route !== null)
      .slice(0, MAX_ROUTES);

    return {
      alerts: [],
      regions,
      routes,
      vehicles,
      warehouses,
      stats: {
        totalAlerts: 0,
        totalRoutes: deliveriesQuery.data?.items.length ?? 0,
        totalVehicles: vehiclesQuery.data?.items.length ?? 0,
        totalWarehouses: warehousesQuery.data?.items.length ?? 0,
      },
    };
  }, [
    analyticsQuery.data?.regionBreakdown,
    deliveriesQuery.data?.items,
    statusFilters,
    vehiclesQuery.data?.items,
    warehousesQuery.data?.items,
  ]);

  return {
    data: sceneData,
    error: vehiclesQuery.error ?? deliveriesQuery.error ?? warehousesQuery.error ?? analyticsQuery.error,
    errorMessage: getFleet3DDataErrorMessage({
      analytics: analyticsQuery.error,
      deliveries: deliveriesQuery.error,
      vehicles: vehiclesQuery.error,
      warehouses: warehousesQuery.error,
    }),
    isLoading: vehiclesQuery.isLoading || deliveriesQuery.isLoading || warehousesQuery.isLoading || analyticsQuery.isLoading,
    refetch: () => {
      void vehiclesQuery.refetch();
      void deliveriesQuery.refetch();
      void warehousesQuery.refetch();
      void analyticsQuery.refetch();
    },
  };
}

function getFleet3DDataErrorMessage(errors: {
  analytics: Error | null;
  deliveries: Error | null;
  vehicles: Error | null;
  warehouses: Error | null;
}) {
  const labels: Record<keyof typeof errors, string> = {
    analytics: 'Analytics GraphQL API',
    deliveries: 'Deliveries API',
    vehicles: 'Vehicles API',
    warehouses: 'Warehouses API',
  };
  const failed = (Object.entries(errors) as [keyof typeof errors, Error | null][])
    .filter((entry): entry is [keyof typeof errors, Error] => entry[1] !== null)
    .map(([key, error]) => `${labels[key]} unavailable: ${error.message}`);

  return failed.length > 0 ? failed.join(' ') : null;
}

function vehiclePriority(vehicle: { status: string; lastSeenAt: string | null }) {
  const statusWeight: Record<string, number> = {
    ACTIVE: 4,
    IDLE: 3,
    MAINTENANCE: 2,
    OFFLINE: 1,
  };

  return (statusWeight[vehicle.status] ?? 0) * 10_000_000_000 + (vehicle.lastSeenAt ? new Date(vehicle.lastSeenAt).getTime() : 0);
}
