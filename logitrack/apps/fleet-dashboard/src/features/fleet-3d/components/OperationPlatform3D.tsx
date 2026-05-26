import { Line } from '@react-three/drei';

const platformWidth = 84;
const platformDepth = 58;
const gridStep = 7;

export function OperationPlatform3D() {
  const xLines = buildLinePositions(platformWidth, gridStep);
  const zLines = buildLinePositions(platformDepth, gridStep);

  return (
    <group>
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[platformWidth + 2.4, 0.24, platformDepth + 2.4]} />
        <meshStandardMaterial color="#dfe8ef" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[platformWidth, platformDepth]} />
        <meshStandardMaterial color="#f7fafc" roughness={0.92} />
      </mesh>
      <mesh position={[0, -0.235, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[platformWidth + 8, platformDepth + 8]} />
        <meshBasicMaterial color="#bfceda" transparent opacity={0.16} />
      </mesh>

      {xLines.map((x) => (
        <Line
          color={x === 0 ? '#9fb1c2' : '#d8e2ea'}
          key={`x-${x}`}
          lineWidth={x === 0 ? 1.3 : 0.7}
          opacity={x === 0 ? 0.5 : 0.34}
          points={[[x, -0.045, -platformDepth / 2], [x, -0.045, platformDepth / 2]]}
          transparent
        />
      ))}
      {zLines.map((z) => (
        <Line
          color={z === 0 ? '#9fb1c2' : '#d8e2ea'}
          key={`z-${z}`}
          lineWidth={z === 0 ? 1.3 : 0.7}
          opacity={z === 0 ? 0.5 : 0.34}
          points={[[-platformWidth / 2, -0.044, z], [platformWidth / 2, -0.044, z]]}
          transparent
        />
      ))}
      <Line
        color="#b6c6d3"
        lineWidth={1.4}
        opacity={0.62}
        points={[
          [-platformWidth / 2, -0.035, -platformDepth / 2],
          [platformWidth / 2, -0.035, -platformDepth / 2],
          [platformWidth / 2, -0.035, platformDepth / 2],
          [-platformWidth / 2, -0.035, platformDepth / 2],
          [-platformWidth / 2, -0.035, -platformDepth / 2],
        ]}
        transparent
      />
    </group>
  );
}

function buildLinePositions(size: number, step: number) {
  const half = size / 2;
  const count = Math.floor(size / step);

  return Array.from({ length: count + 1 }, (_, index) => {
    const value = -half + index * step;

    return Math.abs(value) < step / 2 ? 0 : Number(value.toFixed(2));
  });
}
