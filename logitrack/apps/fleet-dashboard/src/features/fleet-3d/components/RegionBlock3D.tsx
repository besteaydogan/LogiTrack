import { Billboard, Edges, Text } from '@react-three/drei';

import type { Fleet3DRegion, Fleet3DSelection } from '../types/fleet3d.types';

type RegionBlock3DProps = {
  region: Fleet3DRegion;
  selected: boolean;
  onSelect: (selection: Fleet3DSelection) => void;
};

export function RegionBlock3D({ onSelect, region, selected }: RegionBlock3DProps) {
  const color = region.delayRate >= 45 ? '#dc2626' : region.delayRate >= 25 ? '#f59e0b' : '#22c55e';
  const severity = region.delayRate >= 45 ? 'High delay' : region.delayRate >= 25 ? 'Medium delay' : 'Low delay';

  return (
    <group position={region.position}>
      <mesh position={[0, -region.height / 2 + 0.02, 0]}>
        <boxGeometry args={[region.footprint + 4.8, 0.04, region.footprint + 3.8]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.22 : 0.13} />
      </mesh>
      <mesh onClick={(event) => {
        event.stopPropagation();
        onSelect({ type: 'region', item: region });
      }}>
        <boxGeometry args={[region.footprint, region.height, region.footprint]} />
        <meshStandardMaterial color={color} emissive={selected ? color : '#000000'} emissiveIntensity={selected ? 0.22 : 0.04} roughness={0.62} />
        <Edges color={selected ? '#0f172a' : '#f8fafc'} />
      </mesh>
      <mesh position={[0, region.height / 2 + 0.06, 0]}>
        <boxGeometry args={[region.footprint + 0.44, 0.16, region.footprint + 0.44]} />
        <meshStandardMaterial color="#f8fafc" transparent opacity={0.84} roughness={0.78} />
      </mesh>
      <Text
        color="#102033"
        fontSize={0.78}
        fontWeight={700}
        maxWidth={8}
        position={[0, region.height / 2 + 0.18, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {`${region.delayRate.toFixed(0)}%`}
      </Text>
      <Billboard position={[0, region.height / 2 + 1.75, 0]}>
        <Text color="#0f172a" fontSize={0.58} fontWeight={700} maxWidth={7.6} outlineColor="#ffffff" outlineWidth={0.05}>
          {`${region.region}\n${severity} | ${region.delayRate.toFixed(1)}%`}
        </Text>
      </Billboard>
    </group>
  );
}
