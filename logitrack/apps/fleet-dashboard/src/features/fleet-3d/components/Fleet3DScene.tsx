import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import type { Fleet3DLayerState, Fleet3DSceneData, Fleet3DSelection } from '../types/fleet3d.types';
import { AlertPulse3D } from './AlertPulse3D';
import { DeliveryRoute3D } from './DeliveryRoute3D';
import { OperationPlatform3D } from './OperationPlatform3D';
import { RegionBlock3D } from './RegionBlock3D';
import { VehicleMarker3D } from './VehicleMarker3D';
import { WarehouseNode3D } from './WarehouseNode3D';

const defaultCameraPosition: [number, number, number] = [34, 50, 48];
const defaultCameraTarget: [number, number, number] = [0, 5.5, -1];

export type Fleet3DSceneHandle = {
  resetCamera: () => void;
};

type Fleet3DSceneProps = {
  data: Fleet3DSceneData;
  layers: Fleet3DLayerState;
  onSelectionChange: (selection: Fleet3DSelection) => void;
  selection: Fleet3DSelection;
};

export const Fleet3DScene = forwardRef<Fleet3DSceneHandle, Fleet3DSceneProps>(function Fleet3DScene({
  data,
  layers,
  onSelectionChange,
  selection,
}, ref) {
  const controlsRef = useRef<{ reset: () => void } | null>(null);
  const [resetKey, setResetKey] = useState(0);

  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      controlsRef.current?.reset();
      setResetKey((current) => current + 1);
    },
  }));

  return (
    <Canvas className="fleet-3d-canvas" frameloop={layers.alerts && data.alerts.length > 0 ? 'always' : 'demand'} onPointerMissed={() => onSelectionChange(null)}>
      <color attach="background" args={['#edf4f8']} />
      <PerspectiveCamera key={`camera-${resetKey}`} makeDefault fov={36} position={defaultCameraPosition} />
      <OrbitControls
        key={`controls-${resetKey}`}
        ref={(controls) => { controlsRef.current = controls; }}
        enableDamping
        makeDefault
        maxDistance={105}
        minDistance={18}
        target={defaultCameraTarget}
      />
      <ambientLight intensity={0.92} />
      <directionalLight intensity={1.45} position={[40, 58, 32]} />
      <OperationPlatform3D />

      {layers.regions ? data.regions.map((region) => (
        <RegionBlock3D
          key={region.region}
          onSelect={onSelectionChange}
          region={region}
          selected={selection?.type === 'region' && selection.item.region === region.region}
        />
      )) : null}

      {layers.warehouses ? data.warehouses.map((warehouse) => (
        <WarehouseNode3D
          key={warehouse.id}
          onSelect={onSelectionChange}
          selected={selection?.type === 'warehouse' && selection.item.id === warehouse.id}
          warehouse={warehouse}
        />
      )) : null}

      {layers.routes ? data.routes.map((route) => (
        <DeliveryRoute3D
          key={route.id}
          onSelect={onSelectionChange}
          route={route}
          selected={selection?.type === 'route' && selection.item.id === route.id}
        />
      )) : null}

      {layers.vehicles ? data.vehicles.map((vehicle) => (
        <VehicleMarker3D
          key={vehicle.id}
          onSelect={onSelectionChange}
          selected={selection?.type === 'vehicle' && selection.item.id === vehicle.id}
          vehicle={vehicle}
        />
      )) : null}

      {layers.alerts ? data.alerts.map((pulse) => <AlertPulse3D key={pulse.id} pulse={pulse} />) : null}
    </Canvas>
  );
});
