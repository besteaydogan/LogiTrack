import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { lazy } from 'react';

import { LazyPage } from '@logitrack/ui';

import { RemotePageBoundary } from '@/components/RemotePageBoundary';
import { MainLayout } from '@/layouts/MainLayout';
import { NotFoundPage } from '@/pages/NotFoundPage';

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((module) => ({
  default: module.DashboardPage,
})));
const DeliveryManagementPage = lazy(() => import('deliveryManagement/DeliveryManagementPage').then((module) => ({
  default: module.DeliveryManagementPage ?? module.default,
})));
const AlertCenterPage = lazy(() => import('alertCenter/AlertCenterPage').then((module) => ({
  default: module.AlertCenterPage ?? module.default,
})));
const AnalyticsPage = lazy(() => import('analytics/AnalyticsPage').then((module) => ({
  default: module.AnalyticsPage ?? module.default,
})));
const FleetDashboardPage = lazy(() => import('fleetDashboard/FleetDashboardPage').then((module) => ({
  default: module.FleetDashboardPage ?? module.default,
})));
const Fleet3DFramePage = lazy(() => import('@/pages/Fleet3DFramePage').then((module) => ({
  default: module.Fleet3DFramePage,
})));
const SimulationControlPage = lazy(() => import('@/pages/SimulationControlPage').then((module) => ({
  default: module.SimulationControlPage,
})));

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <LazyPage><DashboardPage /></LazyPage>,
      },
      {
        path: 'dashboard',
        element: <LazyPage><DashboardPage /></LazyPage>,
      },
      {
        path: 'deliveries',
        element: <RemotePageBoundary><LazyPage><DeliveryManagementPage /></LazyPage></RemotePageBoundary>,
      },
      {
        path: 'alerts',
        element: <RemotePageBoundary><LazyPage><AlertCenterPage /></LazyPage></RemotePageBoundary>,
      },
      {
        path: 'analytics',
        element: <RemotePageBoundary><LazyPage><AnalyticsPage /></LazyPage></RemotePageBoundary>,
      },
      {
        path: 'fleet',
        element: <RemotePageBoundary><LazyPage><FleetDashboardPage /></LazyPage></RemotePageBoundary>,
      },
      {
        path: 'fleet/3d',
        element: <LazyPage><Fleet3DFramePage /></LazyPage>,
      },
      {
        path: 'fleet/vehicles/:vehicleId',
        element: <RemotePageBoundary><LazyPage><FleetDashboardPage /></LazyPage></RemotePageBoundary>,
      },
      {
        path: 'simulation',
        element: <LazyPage><SimulationControlPage /></LazyPage>,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];

export const router = createBrowserRouter(appRoutes);
