import type { ReactNode } from 'react';
import { Button } from '@logitrack/ui';

import type { Fleet3DAlertPulse, Fleet3DLayerState, Fleet3DSceneData, Fleet3DSelection } from '../types/fleet3d.types';
import { Fleet3DAlertToasts } from './Fleet3DAlertToasts';
import { Fleet3DLegend } from './Fleet3DLegend';

type Fleet3DDetailPanelProps = {
  alerts: Fleet3DAlertPulse[];
  layers: Fleet3DLayerState;
  onOpen2DMap: () => void;
  stats: Fleet3DSceneData['stats'];
  selection: Fleet3DSelection;
};

export function Fleet3DDetailPanel({ alerts, layers, onOpen2DMap, selection, stats }: Fleet3DDetailPanelProps) {
  if (!selection) {
    return (
      <aside className="fleet-3d-detail fleet-3d-detail--empty">
        <div className="fleet-3d-detail__topline">
          <span className="fleet-3d-detail__badge">Live 3D Control Tower</span>
          <Button onClick={onOpen2DMap} variant="secondary">2D Map</Button>
        </div>
        <h3>Selected object details</h3>
        <p>Select a region block, warehouse node, route, or vehicle to inspect live operational context.</p>
        <div className="fleet-3d-detail__summary-grid">
          <SummaryItem label="Vehicles" value={stats.totalVehicles} />
          <SummaryItem label="Warehouses" value={stats.totalWarehouses} />
          <SummaryItem label="Routes" value={stats.totalRoutes} />
          <SummaryItem label="Alerts" value={stats.totalAlerts} />
        </div>
        <PanelSection title="Visible layers">
          <p>{getVisibleLayerSummary(layers)}</p>
        </PanelSection>
        <PanelSection title="Latest live alerts">
          <Fleet3DAlertToasts pulses={alerts} />
        </PanelSection>
        <PanelSection title="Visual key">
          <Fleet3DLegend />
        </PanelSection>
      </aside>
    );
  }

  if (selection.type === 'vehicle') {
    const vehicle = selection.item;

    return (
      <aside className="fleet-3d-detail">
        <PanelTopline label="Vehicle" onOpen2DMap={onOpen2DMap} />
        <h3>{vehicle.plate}</h3>
        <DetailItem label="Type" value={vehicle.type} />
        <DetailItem label="Status" value={vehicle.status} />
        <DetailItem label="Driver" value={vehicle.currentDriver?.name ?? 'Unassigned'} />
        <DetailItem label="Last seen" value={formatDateTime(vehicle.lastSeenAt)} />
      </aside>
    );
  }

  if (selection.type === 'warehouse') {
    const warehouse = selection.item;

    return (
      <aside className="fleet-3d-detail">
        <PanelTopline label="Warehouse" onOpen2DMap={onOpen2DMap} />
        <h3>{warehouse.name}</h3>
        <DetailItem label="City" value={`${warehouse.city} / ${warehouse.district}`} />
        <DetailItem label="Capacity" value={String(warehouse.capacity)} />
        <DetailItem label="Latitude" value={warehouse.latitude.toFixed(4)} />
        <DetailItem label="Longitude" value={warehouse.longitude.toFixed(4)} />
      </aside>
    );
  }

  if (selection.type === 'region') {
    const region = selection.item;

    return (
      <aside className="fleet-3d-detail">
        <PanelTopline label="Region Heatmap" onOpen2DMap={onOpen2DMap} />
        <h3>{region.region}</h3>
        <DetailItem label="Total deliveries" value={String(region.totalDeliveries)} />
        <DetailItem label="Delayed" value={String(region.delayedDeliveries)} />
        <DetailItem label="Average delay" value={`${region.averageDelayMinutes.toFixed(1)} min`} />
        <DetailItem label="Delay rate" value={`${region.delayRate.toFixed(1)}%`} />
      </aside>
    );
  }

  const route = selection.item;

  return (
    <aside className="fleet-3d-detail">
      <PanelTopline label="Delivery Route" onOpen2DMap={onOpen2DMap} />
      <h3>{route.delivery.trackingNumber}</h3>
      <DetailItem label="Status" value={route.status} />
      <DetailItem label="Priority" value={route.delivery.priority} />
      <DetailItem label="Region" value={route.delivery.region} />
      <DetailItem label="Vehicle" value={route.delivery.vehicle.plate} />
      <DetailItem label="Warehouse" value={route.delivery.warehouse.name} />
    </aside>
  );
}

function PanelTopline({ label, onOpen2DMap }: { label: string; onOpen2DMap: () => void }) {
  return (
    <div className="fleet-3d-detail__topline">
      <span className="fleet-3d-detail__badge">{label}</span>
      <Button onClick={onOpen2DMap} variant="secondary">2D Map</Button>
    </div>
  );
}

function PanelSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="fleet-3d-detail__section">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="fleet-3d-detail__summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="fleet-3d-detail__item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getVisibleLayerSummary(layers: Fleet3DLayerState) {
  const visible = Object.entries(layers)
    .filter(([, enabled]) => enabled)
    .map(([layer]) => layer);

  return visible.length > 0 ? visible.join(', ') : 'No visible layers';
}

function formatDateTime(value: string | null) {
  return value ? new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value)) : 'No signal';
}
