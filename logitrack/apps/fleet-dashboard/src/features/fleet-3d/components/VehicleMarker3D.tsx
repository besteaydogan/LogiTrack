import { Billboard, Edges, Text } from '@react-three/drei';
import { useState } from 'react';

import type { Fleet3DSelection, Fleet3DVehicle } from '../types/fleet3d.types';
import { getVehicleStatusColor } from '../utils/getVehicleStatusColor';

type VehicleMarker3DProps = {
  onSelect: (selection: Fleet3DSelection) => void;
  selected: boolean;
  vehicle: Fleet3DVehicle;
};

export function VehicleMarker3D({ onSelect, selected, vehicle }: VehicleMarker3DProps) {
  const [hovered, setHovered] = useState(false);
  const color = getVehicleStatusColor(vehicle.status);
  const showLabel = hovered || selected || vehicle.status === 'ACTIVE';
  const isTruck = vehicle.type.toLowerCase().includes('truck');
  const bodyLength = isTruck ? 2.1 : 1.55;
  const bodyHeight = isTruck ? 0.68 : 0.58;

  return (
    <group position={vehicle.position}>
      <group
        onClick={(event) => {
          event.stopPropagation();
          onSelect({ type: 'vehicle', item: vehicle });
        }}
        onPointerOut={() => setHovered(false)}
        onPointerOver={() => setHovered(true)}
      >
        <mesh position={[0.18, 0, 0]}>
          <boxGeometry args={[bodyLength, bodyHeight, 0.86]} />
          <meshStandardMaterial color={color} emissive={selected ? color : '#000000'} emissiveIntensity={selected ? 0.32 : 0.06} roughness={0.52} />
          <Edges color={selected || hovered ? '#0f172a' : '#ffffff'} />
        </mesh>
        <mesh position={[-bodyLength / 2 - 0.38, -0.05, 0]}>
          <boxGeometry args={[0.68, bodyHeight * 0.88, 0.78]} />
          <meshStandardMaterial color="#f8fafc" emissive={selected ? color : '#000000'} emissiveIntensity={selected ? 0.18 : 0} roughness={0.45} />
          <Edges color="#1e293b" />
        </mesh>
        {[-0.62, 0.62].map((z) => (
          <group key={z}>
            <mesh position={[-0.72, -0.48, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.19, 0.19, 0.12, 18]} />
              <meshStandardMaterial color="#0f172a" roughness={0.7} />
            </mesh>
            <mesh position={[0.72, -0.48, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.19, 0.19, 0.12, 18]} />
              <meshStandardMaterial color="#0f172a" roughness={0.7} />
            </mesh>
          </group>
        ))}
      </group>
      {showLabel ? (
        <Billboard position={[0, 1.18, 0]}>
          <Text color="#102033" fontSize={0.38} fontWeight={700} maxWidth={3.8} outlineColor="#ffffff" outlineWidth={0.04}>
            {`${vehicle.plate} | ${vehicle.status}`}
          </Text>
        </Billboard>
      ) : null}
    </group>
  );
}
