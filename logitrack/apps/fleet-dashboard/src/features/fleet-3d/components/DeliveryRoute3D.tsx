import { Line } from '@react-three/drei';

import type { Fleet3DRoute, Fleet3DSelection } from '../types/fleet3d.types';

type DeliveryRoute3DProps = {
  onSelect: (selection: Fleet3DSelection) => void;
  route: Fleet3DRoute;
  selected: boolean;
};

export function DeliveryRoute3D({ onSelect, route, selected }: DeliveryRoute3DProps) {
  const routeLength = Math.hypot(route.end[0] - route.start[0], route.end[2] - route.start[2]);
  const arcHeight = Math.min(9, Math.max(2.6, routeLength * 0.1));
  const midpoint = [
    (route.start[0] + route.end[0]) / 2,
    Math.max(route.start[1], route.end[1]) + arcHeight,
    (route.start[2] + route.end[2]) / 2,
  ] as [number, number, number];
  const points = buildCurve(route.start, midpoint, route.end);
  const isDelayed = route.status === 'DELAYED';

  return (
    <group>
      <Line
        color={route.color}
        lineWidth={selected ? 7 : isDelayed ? 5.5 : 3.8}
        onClick={(event) => {
          event.stopPropagation();
          onSelect({ type: 'route', item: route });
        }}
        points={points}
        transparent
        opacity={selected ? 0.94 : isDelayed ? 0.82 : 0.56}
      />
      <EndpointMarker color={route.color} position={route.start} selected={selected} />
      <EndpointMarker color={route.color} position={route.end} selected={selected} />
    </group>
  );
}

function EndpointMarker({ color, position, selected }: { color: string; position: [number, number, number]; selected: boolean }) {
  return (
    <mesh position={[position[0], Math.max(0.18, position[1] - 0.08), position[2]]}>
      <sphereGeometry args={[selected ? 0.58 : 0.42, 18, 18]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 0.28 : 0.1} roughness={0.55} />
    </mesh>
  );
}

function buildCurve(start: [number, number, number], control: [number, number, number], end: [number, number, number]) {
  return Array.from({ length: 18 }, (_, index) => {
    const t = index / 17;
    const inverse = 1 - t;

    return [
      inverse * inverse * start[0] + 2 * inverse * t * control[0] + t * t * end[0],
      inverse * inverse * start[1] + 2 * inverse * t * control[1] + t * t * end[1],
      inverse * inverse * start[2] + 2 * inverse * t * control[2] + t * t * end[2],
    ] as [number, number, number];
  });
}
