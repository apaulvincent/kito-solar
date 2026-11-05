// src/features/combiner-builder/three/InsulatedWireTubeMesh.tsx
import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CombinerWireConnection, FerruleColor } from '../types';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';
import { createCurveFromWaypoints, getTubeRadiusForGauge } from '../utils/wireRouting3D';

interface InsulatedWireTubeMeshProps {
  wire: CombinerWireConnection;
}

export function InsulatedWireTubeMesh({ wire }: InsulatedWireTubeMeshProps) {
  const [isHovered, setIsHovered] = useState(false);
  const pulseSphereRef = useRef<THREE.Mesh>(null);
  const pulseT = useRef(Math.random());

  const selectedWireId = useCombinerBoxStore((s) => s.selectedWireId);
  const setSelectedWire = useCombinerBoxStore((s) => s.setSelectedWire);
  const removeWire = useCombinerBoxStore((s) => s.removeWire);
  const canvasTool = useCombinerBoxStore((s) => s.canvasTool);
  const isEnergized = useCombinerBoxStore((s) => s.isEnergized);

  const isSelected = selectedWireId === wire.id;

  // Build 3D curve and tube geometry
  const curve = useMemo(() => {
    if (!wire.waypoints3D || wire.waypoints3D.length < 2) return null;
    return createCurveFromWaypoints(wire.waypoints3D);
  }, [wire.waypoints3D]);

  const tubeRadius = useMemo(() => {
    return getTubeRadiusForGauge(wire.gaugeMm2);
  }, [wire.gaugeMm2]);

  const tubeGeo = useMemo(() => {
    if (!curve) return null;
    return new THREE.TubeGeometry(curve, 32, tubeRadius, 8, false);
  }, [curve, tubeRadius]);

  // Compute endpoints for ferrule sleeves
  const ferrules = useMemo(() => {
    if (!curve) return null;
    const startPoint = curve.getPointAt(0);
    const startTangent = curve.getTangentAt(0);
    const endPoint = curve.getPointAt(1);
    const endTangent = curve.getTangentAt(1);
    return { startPoint, startTangent, endPoint, endTangent };
  }, [curve]);

  // Animate live electric current pulse along active energized wire
  useFrame((_, delta) => {
    if (isEnergized && curve && pulseSphereRef.current) {
      pulseT.current = (pulseT.current + delta * 0.45) % 1.0;
      const point = curve.getPointAt(pulseT.current);
      pulseSphereRef.current.position.copy(point);
    }
  });

  if (!tubeGeo || !curve) return null;

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (canvasTool === 'cut') {
      removeWire(wire.id);
    } else {
      setSelectedWire(wire.id);
    }
  };

  const ferruleHex = getFerruleHex(wire.ferruleColor);

  return (
    <group
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setIsHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setIsHovered(false);
      }}
    >
      {/* Main Insulated Wire Tube Geometry */}
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial
          color={
            canvasTool === 'cut' && isHovered
              ? '#ef4444'
              : isSelected
              ? '#f59e0b'
              : wire.wireColor
          }
          metalness={0.15}
          roughness={0.4}
        />
      </mesh>

      {/* Wire Selection Glow Highlight */}
      {isSelected && (
        <mesh geometry={tubeGeo}>
          <meshBasicMaterial
            color="#f59e0b"
            wireframe
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* Ferrule Crimp Sleeves at Both Terminal Entrances */}
      {ferrules && (
        <>
          <mesh position={ferrules.startPoint}>
            <cylinderGeometry args={[tubeRadius * 1.35, tubeRadius * 1.35, 0.035, 12]} />
            <meshStandardMaterial color={ferruleHex} metalness={0.4} roughness={0.3} />
          </mesh>
          <mesh position={ferrules.endPoint}>
            <cylinderGeometry args={[tubeRadius * 1.35, tubeRadius * 1.35, 0.035, 12]} />
            <meshStandardMaterial color={ferruleHex} metalness={0.4} roughness={0.3} />
          </mesh>
        </>
      )}

      {/* Glowing Current Pulse Particles (Active Energized State) */}
      {isEnergized && (
        <mesh ref={pulseSphereRef}>
          <sphereGeometry args={[tubeRadius * 1.6, 12, 12]} />
          <meshBasicMaterial
            color={wire.wireColor === '#ef4444' ? '#fca5a5' : '#93c5fd'}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}

function getFerruleHex(color: FerruleColor): string {
  switch (color) {
    case 'red':
      return '#ef4444';
    case 'blue':
      return '#3b82f6';
    case 'black':
      return '#1e293b';
    case 'white':
      return '#f8fafc';
    case 'yellow':
      return '#eab308';
    case 'green_yellow':
      return '#22c55e';
    default:
      return '#94a3b8';
  }
}
