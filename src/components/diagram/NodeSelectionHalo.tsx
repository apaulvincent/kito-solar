import * as THREE from 'three';
import { MountSurface } from '@/types/layout3d';

interface NodeSelectionHaloProps {
  surface: MountSurface;
  width: number;
  height: number;
  isSelected: boolean;
  floorRingColor: string;
  floorRingYOffset: number;
  floorRingInnerRadius?: number;
  floorRingOuterRadius?: number;
}

export function NodeSelectionHalo({
  surface,
  width,
  height,
  isSelected,
  floorRingColor,
  floorRingYOffset,
  floorRingInnerRadius = 0.9,
  floorRingOuterRadius = 1.15,
}: NodeSelectionHaloProps) {
  if (surface === 'wall') {
    const haloWidth = width + 0.35;
    const haloHeight = height + 0.35;
    const color = isSelected ? '#F59E0B' : '#38BDF8';

    return (
      <group position={[0, 0, -0.08]}>
        <mesh>
          <planeGeometry args={[haloWidth, haloHeight]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isSelected ? 0.45 : 0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(haloWidth, haloHeight)]} />
          <lineBasicMaterial
            color={color}
            transparent
            opacity={isSelected ? 0.9 : 0.6}
          />
        </lineSegments>
      </group>
    );
  }

  return (
    <mesh position={[0, floorRingYOffset, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[floorRingInnerRadius, floorRingOuterRadius, 32]} />
      <meshBasicMaterial
        color={isSelected ? '#F59E0B' : floorRingColor}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
