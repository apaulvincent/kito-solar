// src/components/diagram/DiagramNodeMesh.tsx
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { DiagramNodeKey } from '@/types/diagram';
import { useCalculatorStore } from '@/store/useCalculatorStore';

interface DiagramNodeMeshProps {
  nodeKey: DiagramNodeKey;
  label: string;
  sublabel?: string;
  position: [number, number, number];
  color?: string;
  nodeType?: 'pv' | 'breaker' | 'isolator' | 'spd' | 'inverter' | 'battery' | 'panel' | 'grid' | 'load';
}

export function DiagramNodeMesh({
  nodeKey,
  label,
  sublabel,
  position,
  color = '#D97706',
  nodeType = 'breaker',
}: DiagramNodeMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const hoveredNodeKey = useCalculatorStore((s) => s.hoveredNodeKey);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const setHoveredNodeKey = useCalculatorStore((s) => s.setHoveredNodeKey);

  const [hovered, setHovered] = useState(false);
  const isSelected = selectedNodeKey === nodeKey;
  const isHovered = hoveredNodeKey === nodeKey || hovered;
  const isAnyActive = Boolean(selectedNodeKey || hoveredNodeKey);
  const isDimmed = isAnyActive && !isSelected && !isHovered;

  // Spring physics scaling
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetScale = isSelected ? 1.15 : isHovered ? 1.08 : isDimmed ? 0.95 : 1.0;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 14);
  });

  const renderGeometry = () => {
    switch (nodeType) {
      case 'pv':
        return (
          <group>
            {/* Aluminum Outer Mounting Frame */}
            <mesh rotation={[-0.4, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.5, 0.08, 1.6]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Dark Blue Crystalline Solar Cells */}
            <mesh position={[0, 0.05, 0]} rotation={[-0.4, 0, 0]}>
              <boxGeometry args={[2.38, 0.02, 1.48]} />
              <meshStandardMaterial
                color={isSelected || isHovered ? '#0284C7' : '#0F2B5C'}
                roughness={0.15}
                metalness={0.6}
              />
            </mesh>
            {/* Busbar grid lines */}
            <mesh position={[0, 0.065, 0]} rotation={[-0.4, 0, 0]}>
              <boxGeometry args={[2.35, 0.01, 1.45]} />
              <meshStandardMaterial color="#CBD5E1" wireframe transparent opacity={0.35} />
            </mesh>
            {/* Rear Mounting Strut */}
            <mesh position={[0, -0.4, -0.5]}>
              <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
              <meshStandardMaterial color="#64748B" metalness={0.8} />
            </mesh>
          </group>
        );

      case 'inverter':
        return (
          <group>
            {/* Modern White Wall Inverter Chassis */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.6, 2.2, 0.7]} />
              <meshStandardMaterial
                color={isSelected || isHovered ? '#FFFFFF' : '#F8FAFC'}
                roughness={0.2}
                metalness={0.2}
              />
            </mesh>
            {/* Subtle Metallic Bevel Rim */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.62, 2.22, 0.1]} />
              <meshStandardMaterial color="#E2E8F0" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Dark Status Screen Display */}
            <mesh position={[0, 0.35, 0.36]}>
              <planeGeometry args={[0.8, 0.55]} />
              <meshStandardMaterial color="#0F172A" roughness={0.1} />
            </mesh>
            {/* Cyan Telemetry Line on Screen */}
            <mesh position={[0, 0.35, 0.37]}>
              <planeGeometry args={[0.65, 0.25]} />
              <meshStandardMaterial color="#0284C7" emissive="#0284C7" emissiveIntensity={0.6} />
            </mesh>
            {/* Status LED */}
            <mesh position={[0.5, 0.8, 0.36]}>
              <circleGeometry args={[0.05, 16]} />
              <meshBasicMaterial color="#059669" />
            </mesh>
          </group>
        );

      case 'battery':
        return (
          <group>
            {/* Clean White Powerwall Enclosure */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.4, 1.8, 0.6]} />
              <meshStandardMaterial
                color={isSelected || isHovered ? '#FFFFFF' : '#F1F5F9'}
                roughness={0.25}
                metalness={0.2}
              />
            </mesh>
            {/* Graphite Side Accents */}
            <mesh position={[-0.71, 0, 0]}>
              <boxGeometry args={[0.04, 1.75, 0.58]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            <mesh position={[0.71, 0, 0]}>
              <boxGeometry args={[0.04, 1.75, 0.58]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            {/* Glowing Green SOC Bar */}
            <mesh position={[0, 0.45, 0.31]}>
              <boxGeometry args={[0.85, 0.08, 0.02]} />
              <meshStandardMaterial color="#059669" emissive="#059669" emissiveIntensity={0.8} />
            </mesh>
          </group>
        );

      case 'isolator':
        return (
          <group>
            {/* Industrial Weatherproof Enclosure */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.85, 1.05, 0.55]} />
              <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.2} />
            </mesh>
            {/* Rotary Switch Base */}
            <mesh position={[0, 0, 0.29]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.26, 0.26, 0.08, 24]} />
              <meshStandardMaterial color="#FBBF24" />
            </mesh>
            {/* Red Lockable Switch Knob */}
            <mesh position={[0, 0, 0.35]}>
              <boxGeometry args={[0.1, 0.36, 0.12]} />
              <meshStandardMaterial color="#DC2626" />
            </mesh>
          </group>
        );

      case 'spd':
        return (
          <group>
            {/* Modular DIN Rail Surge Protector */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.8, 0.95, 0.5]} />
              <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
            </mesh>
            {/* Cartridge 1 Indicator */}
            <mesh position={[-0.18, 0.1, 0.26]}>
              <boxGeometry args={[0.22, 0.4, 0.04]} />
              <meshStandardMaterial color="#059669" />
            </mesh>
            {/* Cartridge 2 Indicator */}
            <mesh position={[0.18, 0.1, 0.26]}>
              <boxGeometry args={[0.22, 0.4, 0.04]} />
              <meshStandardMaterial color="#059669" />
            </mesh>
          </group>
        );

      case 'panel':
        return (
          <group>
            {/* Steel Subpanel Cabinet */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.1, 1.6, 0.45]} />
              <meshStandardMaterial color="#64748B" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Door seam */}
            <mesh position={[0, 0, 0.23]}>
              <boxGeometry args={[0.95, 1.45, 0.02]} />
              <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
            </mesh>
          </group>
        );

      case 'grid':
        return (
          <group>
            {/* Utility Transformer Post */}
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.08, 0.15, 1.6, 12]} />
              <meshStandardMaterial color="#64748B" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Crossarm */}
            <mesh position={[0, 1.25, 0]}>
              <boxGeometry args={[1.2, 0.08, 0.08]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            {/* Insulators */}
            <mesh position={[-0.5, 1.35, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.14, 8]} />
              <meshStandardMaterial color="#E2E8F0" />
            </mesh>
            <mesh position={[0.5, 1.35, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.14, 8]} />
              <meshStandardMaterial color="#E2E8F0" />
            </mesh>
          </group>
        );

      case 'load':
        return (
          <group>
            {/* Architectural Building Structure */}
            <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.3, 0.7, 1.1]} />
              <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
            </mesh>
            {/* Roof Pitch */}
            <mesh position={[0, 0.95, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[1.05, 0.55, 4]} />
              <meshStandardMaterial color="#475569" roughness={0.5} />
            </mesh>
          </group>
        );

      case 'breaker':
      default:
        return (
          <group>
            {/* Standard Light Gray DIN-Rail MCB */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.75, 0.95, 0.55]} />
              <meshStandardMaterial color="#F1F5F9" roughness={0.25} metalness={0.15} />
            </mesh>
            {/* Mechanical Switch Toggle */}
            <mesh position={[0, 0.12, 0.3]}>
              <boxGeometry args={[0.2, 0.28, 0.12]} />
              <meshStandardMaterial color={color} roughness={0.3} />
            </mesh>
          </group>
        );
    }
  };

  return (
    <group
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedNodeKey(nodeKey);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        setHoveredNodeKey(nodeKey);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        setHoveredNodeKey(null);
        document.body.style.cursor = 'auto';
      }}
    >
      {renderGeometry()}

      {/* Subtle selection pedestal ring on ground */}
      {(isSelected || isHovered) && (
        <mesh position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.15, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Details Tooltip: ONLY shown when hovered or selected */}
      {(isHovered || isSelected) && (
        <Html
          position={[
            0,
            nodeType === 'inverter'
              ? 2.2
              : nodeType === 'battery'
              ? 1.9
              : nodeType === 'pv'
              ? 1.7
              : 1.3,
            0,
          ]}
          center
          distanceFactor={18}
          className="pointer-events-none select-none z-50"
        >
          <div
            className={`flex flex-col items-center px-3 py-2 rounded-xl border text-center whitespace-nowrap shadow-xl transition-all duration-200 transform scale-105 backdrop-blur-md ${
              isSelected
                ? 'bg-amber-600 text-white border-amber-400 ring-4 ring-amber-500/25'
                : 'bg-slate-900/95 dark:bg-slate-800/95 text-white border-slate-700/80 ring-2 ring-slate-900/30'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-wide uppercase">
                {label}
              </span>
            </div>
            {sublabel && (
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                  isSelected
                    ? 'bg-amber-700/70 text-amber-100'
                    : 'bg-slate-800 dark:bg-slate-900/80 text-amber-300 border border-slate-700'
                }`}
              >
                {sublabel}
              </span>
            )}
            <span className="text-[8px] font-mono text-slate-300 dark:text-slate-400 mt-1 uppercase tracking-wider">
              {isSelected ? 'Focused • Click to inspect' : 'Click to inspect specs'}
            </span>
            {/* Pointer arrow tip */}
            <div
              className={`w-2 h-2 rotate-45 border-b border-r -mb-3 mt-1.5 ${
                isSelected
                  ? 'bg-amber-600 border-amber-400'
                  : 'bg-slate-900/95 dark:bg-slate-800/95 border-slate-700'
              }`}
            />
          </div>
        </Html>
      )}
    </group>
  );
}
