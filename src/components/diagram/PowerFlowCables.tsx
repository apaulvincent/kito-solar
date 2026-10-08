// src/components/diagram/PowerFlowCables.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CableConnection, DiagramNodeKey } from '@/types/diagram';
import { useCalculatorStore } from '@/store/useCalculatorStore';

interface PowerFlowCablesProps {
  cables: CableConnection[];
  nodePositions: Record<DiagramNodeKey, [number, number, number]>;
  isAnimationPaused?: boolean;
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);

export function PowerFlowCables({
  cables,
  nodePositions,
  isAnimationPaused = false,
}: PowerFlowCablesProps) {
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const hoveredNodeKey = useCalculatorStore((s) => s.hoveredNodeKey);

  const particlesRef = useRef<THREE.Points>(null);

  // Animate pulse particles along cables
  useFrame((state) => {
    if (isAnimationPaused || !particlesRef.current) return;
    const t = state.clock.getElapsedTime();
    const geo = particlesRef.current.geometry;
    const pos = geo.attributes.position;
    if (!pos) return;

    for (let i = 0; i < pos.count; i++) {
      const idx = i * 3;
      const initialPhase = (i / pos.count);
      const currentProgress = (initialPhase + t * 0.35) % 1;

      const cableIndex = Math.floor(i / 8);
      const cable = cables[cableIndex % cables.length];
      if (!cable) continue;

      const pFrom = nodePositions[cable.from];
      const pTo = nodePositions[cable.to];
      if (!pFrom || !pTo) continue;

      // Smooth path from start to end node
      pos.array[idx] = THREE.MathUtils.lerp(pFrom[0], pTo[0], currentProgress);
      pos.array[idx + 1] = THREE.MathUtils.lerp(pFrom[1], pTo[1], currentProgress);
      pos.array[idx + 2] = THREE.MathUtils.lerp(pFrom[2], pTo[2], currentProgress);
    }
    pos.needsUpdate = true;
  });

  const particleCount = cables.length * 8;
  const particlePositions = new Float32Array(particleCount * 3);

  return (
    <group>
      {/* 3D Horizontal Busbars / Cables */}
      {cables.map((cable) => {
        const p1 = nodePositions[cable.from];
        const p2 = nodePositions[cable.to];
        if (!p1 || !p2) return null;

        const isCableActive =
          selectedNodeKey === cable.from ||
          selectedNodeKey === cable.to ||
          hoveredNodeKey === cable.from ||
          hoveredNodeKey === cable.to;

        const start = new THREE.Vector3(...p1);
        const end = new THREE.Vector3(...p2);
        const direction = new THREE.Vector3().subVectors(end, start);
        const distance = direction.length();
        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

        // Correct quaternion rotation from Y-axis to direction vector
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          Y_AXIS,
          direction.clone().normalize()
        );

        // Light mode conduit colors
        const baseColor =
          cable.type === 'dc'
            ? '#D97706' // Warm Amber
            : cable.type === 'battery'
            ? '#059669' // Emerald
            : '#0284C7'; // Cerulean Blue

        return (
          <group key={cable.id} position={midpoint} quaternion={quaternion}>
            {/* Outer Protective Conduit */}
            <mesh>
              <cylinderGeometry args={[isCableActive ? 0.08 : 0.045, isCableActive ? 0.08 : 0.045, distance, 16]} />
              <meshStandardMaterial
                color={isCableActive ? '#D97706' : baseColor}
                roughness={0.25}
                metalness={0.4}
                emissive={isCableActive ? '#D97706' : '#000000'}
                emissiveIntensity={isCableActive ? 0.4 : 0}
              />
            </mesh>
          </group>
        );
      })}

      {/* Animated Electric Current Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.14}
          color="#D97706"
          transparent
          opacity={0.9}
        />
      </points>
    </group>
  );
}
