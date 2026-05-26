import type { DeliveryStatus, VehicleStatus } from '@logitrack/types';

import { getRouteColor } from '../utils/getRouteColor';
import { getVehicleStatusColor } from '../utils/getVehicleStatusColor';

const vehicleStatuses: VehicleStatus[] = ['ACTIVE', 'IDLE', 'MAINTENANCE', 'OFFLINE'];
const routeStatuses: DeliveryStatus[] = ['CREATED', 'ASSIGNED', 'IN_TRANSIT', 'DELAYED'];

export function Fleet3DLegend() {
  return (
    <div className="fleet-3d-legend" aria-label="3D operations legend">
      <div>
        <h4>Vehicles</h4>
        <div className="fleet-3d-legend__row-wrap">
          {vehicleStatuses.map((status) => (
            <span className="fleet-3d-legend__item" key={status}>
              <i style={{ backgroundColor: getVehicleStatusColor(status) }} />
              {status}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h4>Routes</h4>
        <div className="fleet-3d-legend__row-wrap">
          {routeStatuses.map((status) => (
            <span className="fleet-3d-legend__item" key={status}>
              <i className="fleet-3d-legend__line" style={{ backgroundColor: getRouteColor(status) }} />
              {status.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>
      <div className="fleet-3d-legend__row-wrap">
        <span className="fleet-3d-legend__item"><i style={{ backgroundColor: '#22c55e' }} /> Low delay</span>
        <span className="fleet-3d-legend__item"><i style={{ backgroundColor: '#f59e0b' }} /> Medium delay</span>
        <span className="fleet-3d-legend__item"><i style={{ backgroundColor: '#dc2626' }} /> High delay</span>
        <span className="fleet-3d-legend__item"><i className="fleet-3d-legend__building" /> Warehouse</span>
        <span className="fleet-3d-legend__item"><i className="fleet-3d-legend__pulse" /> Alert pulse</span>
      </div>
    </div>
  );
}
