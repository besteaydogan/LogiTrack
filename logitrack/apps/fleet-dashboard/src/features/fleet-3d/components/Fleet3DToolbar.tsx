import type { DeliveryStatus } from '@logitrack/types';

import type { Fleet3DLayerKey, Fleet3DLayerState, Fleet3DSceneData, Fleet3DStatusFilters } from '../types/fleet3d.types';

const layers: { key: Fleet3DLayerKey; label: string }[] = [
  { key: 'regions', label: 'Regions' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'warehouses', label: 'Warehouses' },
  { key: 'routes', label: 'Routes' },
  { key: 'alerts', label: 'Alerts' },
];

const statuses: DeliveryStatus[] = ['CREATED', 'ASSIGNED', 'IN_TRANSIT', 'DELAYED', 'DELIVERED', 'CANCELLED'];

type Fleet3DToolbarProps = {
  layers: Fleet3DLayerState;
  onResetCamera: () => void;
  onToggleLayer: (layer: Fleet3DLayerKey) => void;
  onToggleStatus: (status: DeliveryStatus) => void;
  stats: Fleet3DSceneData['stats'];
  statusFilters: Fleet3DStatusFilters;
};

export function Fleet3DToolbar({
  layers: layerState,
  onResetCamera,
  onToggleLayer,
  onToggleStatus,
  stats,
  statusFilters,
}: Fleet3DToolbarProps) {
  return (
    <div className="fleet-3d-toolbar" aria-label="3D fleet controls">
      <div className="fleet-3d-toolbar__section" aria-label="Layer toggles">
        <span className="fleet-3d-toolbar__label">Layers</span>
        <div className="fleet-3d-toolbar__group">
          {layers.map((layer) => (
            <button
              className={layerState[layer.key] ? 'fleet-3d-chip fleet-3d-chip--active' : 'fleet-3d-chip'}
              key={layer.key}
              onClick={() => onToggleLayer(layer.key)}
              type="button"
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>
      <div className="fleet-3d-toolbar__section" aria-label="Delivery status filters">
        <span className="fleet-3d-toolbar__label">Delivery Status</span>
        <div className="fleet-3d-toolbar__group">
          {statuses.map((status) => (
            <button
              className={statusFilters[status] ? 'fleet-3d-chip fleet-3d-chip--status' : 'fleet-3d-chip'}
              key={status}
              onClick={() => onToggleStatus(status)}
              type="button"
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="fleet-3d-toolbar__section" aria-label="3D scene limits">
        <span className="fleet-3d-toolbar__label">Live Counts</span>
        <div className="fleet-3d-toolbar__stats">
          <span>{stats.totalVehicles} vehicles</span>
          <span>{stats.totalWarehouses} warehouses</span>
          <span>{stats.totalRoutes} routes</span>
          <span>{stats.totalAlerts} alerts</span>
        </div>
      </div>
      <div className="fleet-3d-toolbar__section fleet-3d-toolbar__section--camera">
        <span className="fleet-3d-toolbar__label">Camera</span>
        <button className="fleet-3d-reset" onClick={onResetCamera} type="button">Reset camera</button>
      </div>
    </div>
  );
}
