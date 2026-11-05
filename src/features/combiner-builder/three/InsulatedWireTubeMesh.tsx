// src/features/combiner-builder/three/InsulatedWireTubeMesh.tsx
import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { CombinerWireConnection, FerruleColor } from '../types';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';
import { createCurveFromWaypoints, getTubeRadiusForGauge } from '../utils/wireRouting3D';

interface InsulatedWireTubeMeshProps {
  wire: CombinerWireConnection;
}

export function InsulatedWireTubeMesh({ wire }: InsulatedWireTubeMeshProps) {
  const [isHovered, setIsHovered] = useState(false);

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
    const endPoint = curve.getPointAt(1);
    return { startPoint, endPoint };
  }, [curve]);

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
      {/* Main Insulated Wire Tube Geometry (Slimmer gauge with subtle energization glow) */}
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial
          color={
            canvasTool === 'cut' && isHovered
              ? '#ef4444'
              : isSelected
              ? '#f59e0b'
              : wire.wireColor
          }
          emissive={isEnergized ? wire.wireColor : '#000000'}
          emissiveIntensity={isEnergized ? 0.2 : 0}
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
            <cylinderGeometry args={[tubeRadius * 1.35, tubeRadius * 1.35, 0.018, 12]} />
            <meshStandardMaterial color={ferruleHex} metalness={0.4} roughness={0.3} />
          </mesh>
          <mesh position={ferrules.endPoint}>
            <cylinderGeometry args={[tubeRadius * 1.35, tubeRadius * 1.35, 0.018, 12]} />
            <meshStandardMaterial color={ferruleHex} metalness={0.4} roughness={0.3} />
          </mesh>
        </>
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
