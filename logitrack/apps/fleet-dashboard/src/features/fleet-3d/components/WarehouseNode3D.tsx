import { Billboard, Edges, Text } from '@react-three/drei';

import type { Fleet3DSelection, Fleet3DWarehouse } from '../types/fleet3d.types';

type WarehouseNode3DProps = {
  onSelect: (selection: Fleet3DSelection) => void;
  selected: boolean;
  warehouse: Fleet3DWarehouse;
};

export function WarehouseNode3D({ onSelect, selected, warehouse }: WarehouseNode3DProps) {
  return (
    <group position={warehouse.position}>
      <mesh position={[0, -warehouse.height / 2 + 0.05, 0]}>
        <cylinderGeometry args={[4.9, 4.9, 0.1, 48]} />
        <meshBasicMaterial color="#2563eb" transparent opacity={selected ? 0.18 : 0.1} />
      </mesh>
      <mesh position={[0, -warehouse.height / 2 + 0.08, 0]}>
        <cylinderGeometry args={[3.25, 3.25, 0.12, 48]} />
        <meshStandardMaterial color="#dbeafe" roughness={0.74} />
      </mesh>
      <mesh onClick={(event) => {
        event.stopPropagation();
        onSelect({ type: 'warehouse', item: warehouse });
      }}>
        <boxGeometry args={[4.2, warehouse.height, 3.6]} />
        <meshStandardMaterial color="#25364a" emissive={selected ? '#38bdf8' : '#000000'} emissiveIntensity={selected ? 0.28 : 0.04} roughness={0.58} />
        <Edges color={selected ? '#38bdf8' : '#cbd5e1'} />
      </mesh>
      <mesh position={[0, -warehouse.height / 2 + 0.18, 0]}>
        <boxGeometry args={[5.8, 0.42, 4.8]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>
      <mesh position={[1.15, warehouse.height / 2 + 0.34, -0.12]}>
        <boxGeometry args={[1.8, 0.68, 1.5]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      <mesh position={[0, -warehouse.height / 2 + 0.7, -1.85]}>
        <boxGeometry args={[1.95, 0.86, 0.18]} />
        <meshStandardMaterial color="#f59e0b" emissive="#92400e" emissiveIntensity={0.2} roughness={0.56} />
      </mesh>
      <mesh position={[-1.62, 0.48, 1.82]}>
        <boxGeometry args={[0.56, warehouse.height * 0.72, 0.1]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.62} roughness={0.48} />
      </mesh>
      <Billboard position={[0, warehouse.height / 2 + 1.45, 0]}>
        <Text color="#0f172a" fontSize={0.58} fontWeight={700} maxWidth={6.4} outlineColor="#ffffff" outlineWidth={0.05}>
          {`${warehouse.name} | cap ${warehouse.capacity}`}
        </Text>
      </Billboard>
    </group>
  );
}
