// src/features/combiner-builder/three/TerminalPortNode.tsx
import { useState } from 'react';
import { Html } from '@react-three/drei';
import { TerminalPort } from '../types';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';

interface TerminalPortNodeProps {
  port: TerminalPort;
  componentWorldPos: [number, number, number];
}

export function TerminalPortNode({ port, componentWorldPos }: TerminalPortNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const selectedPortId = useCombinerBoxStore((s) => s.selectedPortId);
  const setSelectedPort = useCombinerBoxStore((s) => s.setSelectedPort);
  const connectPorts = useCombinerBoxStore((s) => s.connectPorts);
  const canvasTool = useCombinerBoxStore((s) => s.canvasTool);

  const isSelected = selectedPortId === port.id;

  // Determine port highlight color
  const getPortColor = () => {
    switch (port.polarity) {
      case 'DC_POS':
      case 'L':
        return '#ef4444'; // Red
      case 'DC_NEG':
        return '#020617'; // Dark Slate
      case 'N':
        return '#3b82f6'; // Blue
      case 'PE':
        return '#22c55e'; // Green
      case 'SENSE_L':
      case 'SENSE_N':
        return '#eab308'; // Yellow
      default:
        return '#94a3b8';
    }
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();

    if (canvasTool === 'cut') return;

    if (!selectedPortId) {
      // Start wire connection
      setSelectedPort(port.id);
    } else {
      // Complete wire connection
      connectPorts(selectedPortId, port.id, canvasTool === 'jumper');
    }
  };

  const portColor = getPortColor();
  const radius = port.domain === 'CONTROL_SENSE' ? 0.016 : 0.024;

  return (
    <group position={port.positionOffset}>
      {/* Screw Terminal Clamp Socket (Metallic ring) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 1.5, radius * 1.5, 0.02, 16]} />
        <meshStandardMaterial
          color="#64748b"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Terminal Screw Head / Ferrule Entrance */}
      <mesh
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
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? '#f59e0b' : isHovered ? '#38bdf8' : portColor}
          emissive={isSelected ? '#f59e0b' : isHovered ? '#0284c7' : '#000000'}
          emissiveIntensity={isSelected ? 0.8 : isHovered ? 0.6 : 0}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Active Selection / Wire-Start Pulsing Ring */}
      {(isSelected || isHovered) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.8, radius * 2.4, 24]} />
          <meshBasicMaterial
            color={isSelected ? '#f59e0b' : '#38bdf8'}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Tooltip on Hover or Selection */}
      {(isHovered || isSelected) && (
        <Html
          position={[0, port.entryDirection === 'top' ? 0.12 : -0.12, 0.05]}
          center
          distanceFactor={6}
          style={{ pointerEvents: 'none' }}
        >
          <div className="px-2 py-1 rounded-md bg-slate-950/95 border border-amber-500/50 shadow-xl backdrop-blur-md text-[10px] font-mono text-white whitespace-nowrap z-50 flex items-center gap-1.5 animate-in fade-in">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: portColor }}
            />
            <span className="font-bold text-amber-400">{port.label}</span>
            <span className="text-slate-400">({port.domain})</span>
            {isSelected && <span className="text-amber-300 font-semibold">• SELECT DESTINATION</span>}
          </div>
        </Html>
      )}
    </group>
  );
}
