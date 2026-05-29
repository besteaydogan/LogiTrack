import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, PageHeader, StateMessage } from '@logitrack/ui';
import type { DeliveryStatus } from '@logitrack/types';

import {
  Fleet3DScene,
  type Fleet3DSceneHandle,
} from '../features/fleet-3d/components/Fleet3DScene';
import { Fleet3DDetailPanel } from '../features/fleet-3d/components/Fleet3DDetailPanel';
import { Fleet3DToolbar } from '../features/fleet-3d/components/Fleet3DToolbar';
import { useFleet3DData } from '../features/fleet-3d/hooks/useFleet3DData';
import { useFleetLiveEvents } from '../features/fleet-3d/hooks/useFleetLiveEvents';
import type {
  Fleet3DLayerKey,
  Fleet3DLayerState,
  Fleet3DSelection,
  Fleet3DStatusFilters,
} from '../features/fleet-3d/types/fleet3d.types';
import './Fleet3DPage.css';

const defaultLayers: Fleet3DLayerState = {
  alerts: true,
  regions: true,
  routes: true,
  vehicles: true,
  warehouses: true,
};

const defaultStatusFilters: Fleet3DStatusFilters = {
  CREATED: true,
  ASSIGNED: true,
  IN_TRANSIT: true,
  DELAYED: true,
  DELIVERED: false,
  CANCELLED: false,
};

export function Fleet3DPage() {
  const navigate = useNavigate();
  const isEmbedded = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed') === '1';
  const sceneRef = useRef<Fleet3DSceneHandle | null>(null);
  const [layers, setLayers] = useState<Fleet3DLayerState>(defaultLayers);
  const [statusFilters, setStatusFilters] = useState<Fleet3DStatusFilters>(defaultStatusFilters);
  const [selection, setSelection] = useState<Fleet3DSelection>(null);
  const { data, error, errorMessage, isLoading, refetch } = useFleet3DData(statusFilters);
  const liveEvents = useFleetLiveEvents(data.vehicles);
  const sceneData = useMemo(() => ({
    ...data,
    alerts: liveEvents.pulses,
    stats: {
      ...data.stats,
      totalAlerts: liveEvents.totalAlerts,
    },
  }), [data, liveEvents.pulses, liveEvents.totalAlerts]);

  const toggleLayer = (layer: Fleet3DLayerKey) => {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  };

  const toggleStatus = (status: DeliveryStatus) => {
    setStatusFilters((current) => ({ ...current, [status]: !current[status] }));
  };

  const open2DMap = () => {
    if (isEmbedded) {
      window.parent.postMessage({ type: 'logitrack:navigate', path: '/fleet' }, '*');
    }

    navigate('/fleet');
  };

  if (isLoading) {
    return <StateMessage title="Loading 3D operations" description="Fetching fleet, warehouse, delivery, and analytics data." />;
  }

  if (error) {
    return (
      <>
        {!isEmbedded ? (
          <PageHeader
            eyebrow="Fleet remote"
            title="3D Operations"
            description={errorMessage ?? 'The 3D operations view could not reach one or more backend APIs.'}
            actions={<Button onClick={() => refetch()}>Retry</Button>}
          />
        ) : null}
        <StateMessage title="3D operations unavailable" description="Start the backend services and try again." />
      </>
    );
  }

  return (
    <div className={`fleet-3d-page${isEmbedded ? ' fleet-3d-page--embedded' : ''}`}>
      {!isEmbedded ? (
        <PageHeader
          eyebrow="Fleet remote"
          title="3D Operations"
          description={`Data-driven fleet visualization using analytics regions, seeded warehouses, live vehicles, status routes, and alert pulses. Last event: ${liveEvents.lastEventType ?? 'waiting'}.`}
          actions={<Button variant="secondary" onClick={open2DMap}>2D Map</Button>}
        />
      ) : null}

      <Fleet3DToolbar
        layers={layers}
        onResetCamera={() => sceneRef.current?.resetCamera()}
        onToggleLayer={toggleLayer}
        onToggleStatus={toggleStatus}
        stats={sceneData.stats}
        statusFilters={statusFilters}
      />

      <section className="fleet-3d-layout" aria-label="3D fleet operations scene">
        <div className="fleet-3d-scene-shell">
          <Fleet3DScene
            data={sceneData}
            layers={layers}
            onSelectionChange={setSelection}
            ref={sceneRef}
            selection={selection}
          />
        </div>
        <Fleet3DDetailPanel
          alerts={sceneData.alerts}
          layers={layers}
          onOpen2DMap={open2DMap}
          selection={selection}
          stats={sceneData.stats}
        />
      </section>
    </div>
  );
}

export default Fleet3DPage;
