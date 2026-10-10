// src/components/diagram/DiagramNodeMesh.tsx
import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { DiagramNodeKey } from '@/types/diagram';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { SystemCalculationResult } from '@/types/calculator';
import { NodeGeometry, NodeType } from './NodeGeometry';

interface DiagramNodeMeshProps {
  nodeKey: DiagramNodeKey;
  label: string;
  sublabel?: string;
  position: [number, number, number];
  color?: string;
  nodeType?: NodeType;
}

interface NodeDimensionConfig {
  width: number;
  height: number;
  depth: number;
  isWall: boolean;
  yOffset: number;
}

const NODE_DIMENSIONS: Record<string, NodeDimensionConfig> = {
  inverter: { width: 1.56, height: 1.76, depth: 0.55, isWall: true, yOffset: 1.15 },
  battery: { width: 1.38, height: 1.56, depth: 0.55, isWall: true, yOffset: 1.05 },
  isolator: { width: 0.85, height: 1.05, depth: 0.55, isWall: true, yOffset: 1.0 },
  spd: { width: 0.8, height: 0.95, depth: 0.5, isWall: true, yOffset: 1.0 },
  breaker: { width: 0.78, height: 0.98, depth: 0.55, isWall: true, yOffset: 1.0 },
  ats: { width: 0.95, height: 1.25, depth: 0.52, isWall: true, yOffset: 1.15 },
  panel: { width: 1.15, height: 1.65, depth: 0.45, isWall: true, yOffset: 1.35 },
  pv: { width: 3.9, height: 1.1, depth: 2.0, isWall: false, yOffset: 1.0 },
  grid: { width: 1.4, height: 3.2, depth: 0.6, isWall: false, yOffset: 1.7 },
  load: { width: 1.8, height: 1.6, depth: 1.8, isWall: false, yOffset: 1.1 },
  grounding: { width: 13.0, height: 0.08, depth: 0.05, isWall: true, yOffset: 0.45 },
};

interface NodeTelemetry {
  category: string;
  rating: string;
  voltage: string;
  conductor: string;
  prompt: string;
}

function getNodeTelemetry(
  nodeKey: DiagramNodeKey,
  calculationResult: SystemCalculationResult,
  gridVoltageV: number
): NodeTelemetry {
  switch (nodeKey) {
    case 'pv_array':
      return {
        category: 'GENERATION • DC',
        rating: `${calculationResult.summary.totalPanels} Panels • ${calculationResult.summary.totalArrayPowerKw} kWp`,
        voltage: `Voc: ${(calculationResult.dc.rawCurrentA * 38).toFixed(0)}V • Vmp: ~370V`,
        conductor: `${calculationResult.dc.wireSpec.split(' ')[0] || '10 AWG'} • ${calculationResult.dc.conduitSpec}`,
        prompt: 'Click to inspect PV array sizing',
      };
    case 'dc_isolator':
      return {
        category: 'DC POINT OF ENTRY',
        rating: `${calculationResult.dc.isolatorRatingA}A • 1000V DC rated`,
        voltage: '1000V DC Max • 4-Pole Rotary',
        conductor: `${calculationResult.dc.wireSpec.split(' ')[0] || '10 AWG'} Homerun`,
        prompt: 'Click to inspect DC isolation specs',
      };
    case 'dc_breaker':
      return {
        category: 'DC OVERCURRENT',
        rating: `${calculationResult.dc.breakerRatingA}A • 1.25x Continuous`,
        voltage: '1000V DC • 10kA Icu',
        conductor: `${calculationResult.dc.wireSpec}`,
        prompt: 'Click to inspect DC breaker calculations',
      };
    case 'dc_spd':
      return {
        category: 'SURGE PROTECTION',
        rating: calculationResult.dc.spdRating,
        voltage: 'Uc: 1000V DC • Type II Arrester',
        conductor: '6 mm² Earth to Busbar',
        prompt: 'Click to inspect surge protection',
      };
    case 'inverter':
      return {
        category: 'CENTRAL INVERTER',
        rating: `${calculationResult.summary.inverterPowerKw} kW ${calculationResult.systemType.toUpperCase()}`,
        voltage: `DC Input → ${gridVoltageV}V AC Output`,
        conductor: `AC Feeder: ${calculationResult.ac.wireSpec}`,
        prompt: 'Click to inspect inverter sizing',
      };
    case 'battery_breaker':
      return {
        category: 'BATTERY OVERCURRENT',
        rating: `${calculationResult.battery.recommendedBreakerA}A DC MCCB`,
        voltage: `${calculationResult.battery.bankVoltageV}V DC Nominal`,
        conductor: `${calculationResult.battery.wireSpec}`,
        prompt: 'Click to inspect battery breaker specs',
      };
    case 'battery':
      return {
        category: 'ENERGY STORAGE (ESS)',
        rating: `${(calculationResult.battery.totalEnergyWh / 1000).toFixed(1)} kWh Storage`,
        voltage: `${calculationResult.battery.bankVoltageV}V Nominal Bank`,
        conductor: `${calculationResult.battery.dischargeCurrentA.toFixed(0)}A Max Discharge`,
        prompt: 'Click to inspect battery bank sizing',
      };
    case 'ac_breaker':
      return {
        category: 'AC INVERTER MCB',
        rating: `${calculationResult.ac.breakerRatingA}A AC Breaker`,
        voltage: `${gridVoltageV}V AC 50/60Hz`,
        conductor: `${calculationResult.ac.wireSpec}`,
        prompt: 'Click to inspect AC breaker calculations',
      };
    case 'ac_spd':
      return {
        category: 'AC TRANSIENT PROTECTION',
        rating: calculationResult.ac.spdRating,
        voltage: `Uc: ${gridVoltageV}V AC • Type II Arrester`,
        conductor: '6 mm² Earth to Busbar',
        prompt: 'Click to inspect AC surge arresters',
      };
    case 'ac_isolator':
      return {
        category: 'AC GRID DISCONNECT',
        rating: `${calculationResult.ac.isolatorRatingA}A AC-23A rated`,
        voltage: `${gridVoltageV}V AC • Lockable Rotary`,
        conductor: `${calculationResult.ac.wireSpec}`,
        prompt: 'Click to inspect AC disconnect specs',
      };
    case 'ats':
      return {
        category: 'AUTOMATIC TRANSFER SWITCH',
        rating: calculationResult.ac.atsConfigured
          ? `${calculationResult.ac.atsRatingA}A Transfer Switch`
          : 'ATS Optional',
        voltage: `${gridVoltageV}V Dual-Source Grid/EPS`,
        conductor: `${calculationResult.ac.wireSpec}`,
        prompt: 'Click to inspect automatic transfer switch',
      };
    case 'eps_breaker':
      return {
        category: 'CRITICAL LOADS SUBPANEL',
        rating: `${calculationResult.ac.atsConfigured ? calculationResult.ac.atsRatingA : 60}A Emergency Subpanel`,
        voltage: `${gridVoltageV}V Protected Subpanel Bus`,
        conductor: 'Dedicated Emergency Circuits (Fridge, Lights, Comms)',
        prompt: 'Click to inspect critical loads subpanel',
      };
    case 'main_panel':
      return {
        category: 'FACILITY MAIN PANEL',
        rating: '120% Busbar Interconnection Compliant',
        voltage: `${gridVoltageV}V AC Bus Distribution`,
        conductor: 'Solar + Grid Interconnection',
        prompt: 'Click to inspect panel distribution',
      };
    case 'grid':
      return {
        category: 'UTILITY INTERCONNECT',
        rating: `${gridVoltageV}V Utility Supply`,
        voltage: `${gridVoltageV}V Single/Split Phase`,
        conductor: 'Bi-directional Feed',
        prompt: 'Click to inspect grid parameters',
      };
    case 'load':
      return {
        category: 'FACILITY DEMAND',
        rating: 'Critical & General Loads',
        voltage: `${gridVoltageV}V AC Circuits`,
        conductor: 'Subpanel Branch Circuits',
        prompt: 'Click to inspect facility loads',
      };
    case 'grounding':
      return {
        category: 'EQUIPOTENTIAL GROUNDING',
        rating: 'Solid Copper Ground Busbar • UL 467 Listed',
        voltage: '0V Earth Ground Equipotential Reference',
        conductor: 'Solid Copper Conductor to Driven Earth Rod',
        prompt: 'Click to inspect grounding system specs',
      };
    default:
      return {
        category: 'EQUIPMENT',
        rating: 'Standard Rating',
        voltage: `${gridVoltageV}V`,
        conductor: 'Standard Conductor',
        prompt: 'Click to inspect component',
      };
  }
}

export function DiagramNodeMesh({
  nodeKey,
  label,
  sublabel: _sublabel,
  position,
  color = '#D97706',
  nodeType = 'breaker',
}: DiagramNodeMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const hoveredNodeKey = useCalculatorStore((s) => s.hoveredNodeKey);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const setHoveredNodeKey = useCalculatorStore((s) => s.setHoveredNodeKey);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const gridVoltageV = useCalculatorStore((s) => s.gridVoltageV);

  const [hovered, setHovered] = useState(false);
  const isSelected = selectedNodeKey === nodeKey;
  const isHovered = hoveredNodeKey === nodeKey || hovered;
  const isAnyActive = Boolean(selectedNodeKey || hoveredNodeKey);
  const isDimmed = isAnyActive && !isSelected && !isHovered;

  const dim = NODE_DIMENSIONS[nodeType] || {
    width: 0.75,
    height: 0.95,
    depth: 0.55,
    isWall: true,
    yOffset: 1.0,
  };

  const haloWidth = dim.width + 0.35;
  const haloHeight = dim.height + 0.35;

  // Spring physics scaling on focus/hover
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetScale = isSelected ? 1.15 : isHovered ? 1.08 : isDimmed ? 0.95 : 1.0;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 14);
  });

  const telemetry = useMemo(
    () => getNodeTelemetry(nodeKey, calculationResult, gridVoltageV),
    [nodeKey, calculationResult, gridVoltageV]
  );

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
      <NodeGeometry
        nodeType={nodeType}
        nodeKey={nodeKey}
        isSelected={isSelected}
        isHovered={isHovered}
        color={color}
      />

      {/* Architectural Wall Backplate Glow Halo (Only shown on hover or selection) */}
      {(isSelected || isHovered) && (
        <>
          {dim.isWall ? (
            <group position={[0, 0, -0.08]}>
              {/* Mounting Backplate Glow Backdrop */}
              <mesh>
                <planeGeometry args={[haloWidth, haloHeight]} />
                <meshBasicMaterial
                  color={isSelected ? '#F59E0B' : '#38BDF8'}
                  transparent
                  opacity={isSelected ? 0.45 : 0.25}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Architectural Bracket Outline Border */}
              <lineSegments>
                <edgesGeometry args={[new THREE.PlaneGeometry(haloWidth, haloHeight)]} />
                <lineBasicMaterial
                  color={isSelected ? '#F59E0B' : '#38BDF8'}
                  transparent
                  opacity={isSelected ? 0.9 : 0.6}
                />
              </lineSegments>
            </group>
          ) : (
            /* Outdoor Ground Footprint Ring for ground-mounted equipment */
            <mesh
              position={[0, nodeType === 'pv' ? -1.05 : nodeType === 'grid' ? -1.55 : -0.75, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.9, 1.15, 32]} />
              <meshBasicMaterial
                color={isSelected ? '#F59E0B' : color}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </>
      )}

      {/* Sleek Floating Hover Badge: ONLY shown when hovering in idle mode (disappears when clicked or modal is open) */}
      {isHovered && !selectedNodeKey && (
        <Html
          position={[0, dim.yOffset + 0.35, 0]}
          center
          distanceFactor={16}
          zIndexRange={[15, 0]}
          className="pointer-events-none select-none"
        >
          <div className="pointer-events-none select-none px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 text-white shadow-xl backdrop-blur-md whitespace-nowrap animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <div className="flex items-baseline gap-1.5 font-mono text-[11px]">
                <span className="font-bold text-white tracking-tight">{label}</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-300 font-semibold">{telemetry.rating}</span>
              </div>
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-0.5 flex items-center justify-between gap-3">
              <span className="text-slate-400">{telemetry.category}</span>
              <span className="text-sky-300">Click to inspect</span>
            </div>
            {/* Subtle Downward Pointer Indicator */}
            <div className="w-2 h-2 mx-auto rotate-45 border-b border-r border-slate-700/80 bg-slate-900/90 -mb-2.5 mt-1" />
          </div>
        </Html>
      )}
    </group>
  );
}
