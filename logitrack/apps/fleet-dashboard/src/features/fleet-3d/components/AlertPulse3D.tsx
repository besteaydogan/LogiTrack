import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

import type { Fleet3DAlertPulse } from '../types/fleet3d.types';

type AlertPulse3DProps = {
  pulse: Fleet3DAlertPulse;
};

export function AlertPulse3D({ pulse }: AlertPulse3DProps) {
  const meshRef = useRef<Mesh>(null);
  const outerRef = useRef<Mesh>(null);

  useFrame(({ invalidate, clock }) => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const elapsed = clock.getElapsedTime();
    const scale = 1.2 + (elapsed % 1.15) * 3.1;
    mesh.scale.set(scale, scale, scale);
    outerRef.current?.scale.set(scale * 1.35, scale * 1.35, scale * 1.35);
    invalidate();
  });

  return (
    <group position={[pulse.position[0], 0.16, pulse.position[2]]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.82, 1.02, 44]} />
        <meshBasicMaterial color={pulse.alert.severity === 'CRITICAL' ? '#dc2626' : '#f59e0b'} transparent opacity={0.74} />
      </mesh>
      <mesh ref={outerRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.2, 44]} />
        <meshBasicMaterial color={pulse.alert.severity === 'CRITICAL' ? '#ef4444' : '#fbbf24'} transparent opacity={0.28} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.32, 18, 18]} />
        <meshBasicMaterial color={pulse.alert.severity === 'CRITICAL' ? '#dc2626' : '#f59e0b'} />
      </mesh>
    </group>
  );
}
