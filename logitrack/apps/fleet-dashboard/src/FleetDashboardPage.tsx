import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, PageHeader, StateMessage, Table, type TableColumn } from '@logitrack/ui';
import { getVehicleById, getVehicles, queryKeys, subscribeToVehicleLocations } from '@logitrack/api-client';
import type { Vehicle, VehicleListResponse, VehicleStatus } from '@logitrack/types';

import 'leaflet/dist/leaflet.css';
import './FleetDashboardPage.css';
import { createMarkerUpdateBuffer } from './markerUpdateBuffer';

const statusTone: Record<Vehicle['status'], 'neutral' | 'info' | 'warning' | 'critical' | 'success'> = {
  ACTIVE: 'success',
  IDLE: 'info',
  MAINTENANCE: 'warning',
  OFFLINE: 'critical',
};

const turkeyCenter: [number, number] = [39.9334, 32.8597];

const statusLabels: Record<VehicleStatus, string> = {
  ACTIVE: 'Active',
  IDLE: 'Idle',
  MAINTENANCE: 'Maintenance',
  OFFLINE: 'Offline',
};

const markerIcons: Record<VehicleStatus, L.DivIcon> = {
  ACTIVE: createMarkerIcon('ACTIVE'),
  IDLE: createMarkerIcon('IDLE'),
  MAINTENANCE: createMarkerIcon('MAINTENANCE'),
  OFFLINE: createMarkerIcon('OFFLINE'),
};

const columns: TableColumn<Vehicle>[] = [
  { key: 'plate', header: 'Plate', render: (vehicle) => vehicle.plate },
  { key: 'type', header: 'Type', render: (vehicle) => vehicle.type },
  { key: 'status', header: 'Status', render: (vehicle) => <Badge tone={statusTone[vehicle.status]}>{vehicle.status}</Badge> },
  { key: 'driver', header: 'Driver', render: (vehicle) => vehicle.currentDriver?.name ?? 'Unassigned' },
  { key: 'capacity', header: 'Capacity', align: 'right', render: (vehicle) => vehicle.capacity },
  { key: 'lastSeen', header: 'Last seen', render: (vehicle) => formatDateTime(vehicle.lastSeenAt) },
];

export function FleetDashboardPage() {
  const { vehicleId } = useParams();

  if (vehicleId) {
    return <VehicleDetailPage vehicleId={vehicleId} />;
  }

  return <FleetMapPage />;
}

export default FleetDashboardPage;

function FleetMapPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: getVehicles,
    refetchInterval: 5000,
  });
  const vehicles = useMemo(() => data?.items ?? [], [data?.items]);
  const mappableVehicles = useMemo(() => vehicles.filter(hasLocation), [vehicles]);
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null;
  const mapCenter = mappableVehicles[0]
    ? [mappableVehicles[0].lastLatitude, mappableVehicles[0].lastLongitude] as [number, number]
    : turkeyCenter;
  const summary = useMemo(() => ({
    total: vehicles.length,
    active: vehicles.filter((vehicle) => vehicle.status === 'ACTIVE').length,
    offline: vehicles.filter((vehicle) => vehicle.status === 'OFFLINE').length,
    withLocation: mappableVehicles.length,
  }), [mappableVehicles.length, vehicles]);

  useEffect(() => {
    const buffer = createMarkerUpdateBuffer<VehicleListResponse>((payload) => {
      queryClient.setQueryData(queryKeys.vehicles, payload);
      setLiveStatus('connected');
    });

    const unsubscribe = subscribeToVehicleLocations({
      onError: () => setLiveStatus('disconnected'),
      onMessage: (payload) => buffer.push(payload),
    });

    return () => {
      unsubscribe();
      buffer.dispose();
    };
  }, [queryClient]);

  if (isLoading) {
    return <StateMessage title="Loading fleet" description="Fetching fleet records from the backend API." />;
  }

  if (error || !data) {
    return (
      <>
        <PageHeader
          eyebrow="Fleet remote"
          title="Fleet Dashboard"
          description="The fleet remote could not reach the backend API."
          actions={<Button onClick={() => void refetch()}>Retry</Button>}
        />
        <StateMessage title="Fleet unavailable" description="Start the backend and try again." />
      </>
    );
  }

  return (
    <div className="fleet-page">
      <PageHeader
        eyebrow="Fleet remote"
        title="Fleet Map"
        description="Live vehicle snapshot map from the shared backend API. Simulator location events update PostgreSQL, the backend streams vehicle snapshots over SSE, and markers are throttled before cache writes."
        actions={<Button variant="secondary" onClick={() => navigate('/fleet/3d')}>3D Operations</Button>}
      />

      <section className="fleet-kpis" aria-label="Fleet KPI summary">
        <FleetKpi label="Vehicles" value={summary.total} />
        <FleetKpi label="Active" value={summary.active} />
        <FleetKpi label="Offline" value={summary.offline} />
        <FleetKpi label="With location" value={summary.withLocation} />
        <FleetKpi label="Live stream" value={liveStatus} />
      </section>

      <section className="fleet-map-shell" aria-label="Fleet map and selected vehicle panel">
        <div className="fleet-map-wrap">
          <MarkerLegend />
          {mappableVehicles.length > 0 ? (
            <MapContainer center={mapCenter} className="fleet-map" scrollWheelZoom zoom={10}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mappableVehicles.map((vehicle) => (
                <Marker
                  eventHandlers={{ click: () => setSelectedVehicleId(vehicle.id) }}
                  icon={markerIcons[vehicle.status]}
                  key={vehicle.id}
                  position={[vehicle.lastLatitude, vehicle.lastLongitude]}
                >
                  <Popup>
                    <div className="fleet-popup">
                      <strong>{vehicle.plate}</strong>
                      <span>{vehicle.type}</span>
                      <span>Status: {vehicle.status}</span>
                      <span>Driver: {vehicle.currentDriver?.name ?? 'Unassigned'}</span>
                      <span>Last updated: {formatDateTime(vehicle.lastSeenAt)}</span>
                      <Button onClick={() => navigate(`/fleet/vehicles/${vehicle.id}`)}>View details</Button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <StateMessage title="No vehicle locations" description="Vehicles are loaded, but no latitude/longitude values are available yet." />
          )}
        </div>

        <SelectedVehiclePanel
          onClose={() => setSelectedVehicleId(null)}
          onViewDetails={(id) => navigate(`/fleet/vehicles/${id}`)}
          vehicle={selectedVehicle}
        />
      </section>

      <Table
        ariaLabel="Fleet vehicles"
        columns={columns}
        emptyMessage="No vehicles are available."
        getRowKey={(vehicle) => vehicle.id}
        rows={vehicles}
        virtualized
      />
    </div>
  );
}

function VehicleDetailPage({ vehicleId }: { vehicleId: string }) {
  const navigate = useNavigate();
  const { data: vehicle, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.vehicle(vehicleId),
    queryFn: () => getVehicleById(vehicleId),
  });

  if (isLoading) {
    return <StateMessage title="Loading vehicle" description="Fetching the selected vehicle profile from the backend API." />;
  }

  if (error || !vehicle) {
    return (
      <>
        <PageHeader
          eyebrow="Vehicle detail"
          title="Vehicle unavailable"
          description="The requested vehicle could not be loaded."
          actions={<Button onClick={() => void refetch()}>Retry</Button>}
        />
        <StateMessage title="No vehicle detail" description="Check the vehicle id or start the backend API." />
      </>
    );
  }

  return (
    <div className="fleet-page">
      <PageHeader
        eyebrow="Vehicle detail"
        title={vehicle.plate}
        description="Operational profile for the selected fleet vehicle."
        actions={<Button variant="secondary" onClick={() => navigate('/fleet')}>Back to fleet</Button>}
      />

      <section className="vehicle-detail-grid">
        <Card className="vehicle-profile-card">
          <div className="vehicle-profile-card__header">
            <div>
              <span className="vehicle-profile-card__label">Vehicle</span>
              <h3>{vehicle.plate}</h3>
            </div>
            <Badge tone={statusTone[vehicle.status]}>{vehicle.status}</Badge>
          </div>
          <dl className="vehicle-detail-list">
            <VehicleDetailItem label="Type" value={vehicle.type} />
            <VehicleDetailItem label="Capacity" value={String(vehicle.capacity)} />
            <VehicleDetailItem label="Driver" value={vehicle.currentDriver?.name ?? 'Unassigned'} />
            <VehicleDetailItem label="Last latitude" value={formatCoordinate(vehicle.lastLatitude)} />
            <VehicleDetailItem label="Last longitude" value={formatCoordinate(vehicle.lastLongitude)} />
            <VehicleDetailItem label="Last updated" value={formatDateTime(vehicle.lastSeenAt)} />
          </dl>
        </Card>

        <Card className="vehicle-map-card">
          {hasLocation(vehicle) ? (
            <MapContainer center={[vehicle.lastLatitude, vehicle.lastLongitude]} className="vehicle-detail-map" scrollWheelZoom zoom={12}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker icon={markerIcons[vehicle.status]} position={[vehicle.lastLatitude, vehicle.lastLongitude]}>
                <Popup>{vehicle.plate}</Popup>
              </Marker>
            </MapContainer>
          ) : (
            <StateMessage title="No last known location" description="This vehicle does not have a location snapshot yet." />
          )}
        </Card>
      </section>
    </div>
  );
}

function MarkerLegend() {
  return (
    <div className="fleet-marker-legend" aria-label="Vehicle status legend">
      {(Object.keys(statusLabels) as VehicleStatus[]).map((status) => (
        <span key={status}>
          <i className={`fleet-marker-dot fleet-marker-dot--${status.toLowerCase()}`} />
          {statusLabels[status]}
        </span>
      ))}
    </div>
  );
}

function FleetKpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="fleet-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SelectedVehiclePanel({
  onClose,
  onViewDetails,
  vehicle,
}: {
  onClose: () => void;
  onViewDetails: (id: string) => void;
  vehicle: Vehicle | null;
}) {
  if (!vehicle) {
    return (
      <Card className="selected-vehicle-panel selected-vehicle-panel--empty">
        <h3>No vehicle selected</h3>
        <p>Select a marker to inspect its latest operations snapshot.</p>
      </Card>
    );
  }

  return (
    <Card className="selected-vehicle-panel">
      <div className="selected-vehicle-panel__header">
        <div>
          <span>Selected vehicle</span>
          <h3>{vehicle.plate}</h3>
        </div>
        <button aria-label="Close selected vehicle panel" className="selected-vehicle-panel__close" onClick={onClose} type="button">
          x
        </button>
      </div>
      <dl className="vehicle-detail-list">
        <VehicleDetailItem label="Type" value={vehicle.type} />
        <VehicleDetailItem label="Status" value={vehicle.status} />
        <VehicleDetailItem label="Driver" value={vehicle.currentDriver?.name ?? 'Unassigned'} />
        <VehicleDetailItem label="Latitude" value={formatCoordinate(vehicle.lastLatitude)} />
        <VehicleDetailItem label="Longitude" value={formatCoordinate(vehicle.lastLongitude)} />
        <VehicleDetailItem label="Last updated" value={formatDateTime(vehicle.lastSeenAt)} />
      </dl>
      <Button onClick={() => onViewDetails(vehicle.id)}>View details</Button>
    </Card>
  );
}

function VehicleDetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function hasLocation(vehicle: Vehicle): vehicle is Vehicle & { lastLatitude: number; lastLongitude: number } {
  return vehicle.lastLatitude !== null && vehicle.lastLongitude !== null;
}

function createMarkerIcon(status: VehicleStatus) {
  return L.divIcon({
    className: `fleet-marker fleet-marker--${status.toLowerCase()}`,
    html: '<span></span>',
    iconAnchor: [10, 10],
    iconSize: [20, 20],
  });
}

function formatCoordinate(value: number | null) {
  return value === null ? 'No signal' : value.toFixed(5);
}

function formatDateTime(value: string | null) {
  return value ? new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value)) : 'No signal';
}
