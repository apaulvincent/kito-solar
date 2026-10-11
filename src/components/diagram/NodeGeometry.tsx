// src/components/diagram/NodeGeometry.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useCalculatorStore } from '@/store/useCalculatorStore';

export type NodeType =
  | 'pv'
  | 'breaker'
  | 'isolator'
  | 'spd'
  | 'inverter'
  | 'battery'
  | 'panel'
  | 'grid'
  | 'load'
  | 'ats'
  | 'grounding';

export function getNodeTypeFromKey(key: string): NodeType {
  switch (key) {
    case 'pv_array':
      return 'pv';
    case 'dc_isolator':
    case 'ac_isolator':
      return 'isolator';
    case 'dc_breaker':
    case 'ac_breaker':
    case 'battery_breaker':
    case 'eps_breaker':
      return 'breaker';
    case 'dc_spd':
    case 'ac_spd':
      return 'spd';
    case 'inverter':
      return 'inverter';
    case 'battery':
    case 'battery_wire':
      return 'battery';
    case 'ats':
      return 'ats';
    case 'main_panel':
      return 'panel';
    case 'grid':
      return 'grid';
    case 'load':
      return 'load';
    case 'grounding':
      return 'grounding';
    case 'dc_conduit':
      return 'isolator';
    default:
      return 'breaker';
  }
}

export interface NodeGeometryProps {
  nodeType?: NodeType;
  nodeKey?: string;
  isSelected?: boolean;
  isHovered?: boolean;
  color?: string;
  isStandalone?: boolean;
}

interface AtsNodeGeometryProps {
  isSelected?: boolean;
  isHovered?: boolean;
}

function AtsNodeGeometry({ isSelected: _isSelected, isHovered: _isHovered }: AtsNodeGeometryProps) {
  const atsSource = useCalculatorStore((s) => s.atsSource);
  const toggleAtsSource = useCalculatorStore((s) => s.toggleAtsSource);
  const dialRef = useRef<THREE.Group>(null);

  // Left position (-45 deg): Solar selected (Default).
  // Right position (+45 deg): Utility grid selected.
  const targetRotation = atsSource === 'solar' ? -Math.PI / 4 : Math.PI / 4;

  useFrame((_, delta) => {
    if (dialRef.current) {
      dialRef.current.rotation.z = THREE.MathUtils.damp(
        dialRef.current.rotation.z,
        targetRotation,
        14,
        delta
      );
    }
  });

  const isSolar = atsSource === 'solar';
  const isUtility = atsSource === 'utility';

  return (
    <group>
      {/* Heavy-duty Industrial NEMA 3R Panel Cabinet */}
      <RoundedBox args={[0.95, 1.22, 0.46]} radius={0.03} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#CBD5E1" metalness={0.6} roughness={0.35} />
      </RoundedBox>

      {/* Industrial Door Seam Inset */}
      <mesh position={[0, 0, 0.225]}>
        <boxGeometry args={[0.9, 1.16, 0.015]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.65} roughness={0.3} />
      </mesh>

      {/* Left-Side Stainless Steel Barrel Hinges */}
      {[-0.45, 0.45].map((hy, hIdx) => (
        <group key={`hinge-${hIdx}`} position={[-0.47, hy, 0.22]}>
          <mesh>
            <cylinderGeometry args={[0.025, 0.025, 0.14, 16]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0.02, 0, 0]}>
            <boxGeometry args={[0.04, 0.08, 0.02]} />
            <meshStandardMaterial color="#64748B" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* Chrome Quarter-Turn T-Handle Door Latch */}
      <group position={[0.38, 0, 0.24]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.92} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.03, 0.16, 0.025]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.12} />
        </mesh>
      </group>

      {/* ATS Dual Power Source Status Indicator Lights (Top of Door) */}
      <group position={[0, 0.34, 0.235]}>
        {/* Solar Source Amber Pilot Light (Left) */}
        <mesh position={[-0.15, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          <meshStandardMaterial
            color="#F59E0B"
            emissive="#F59E0B"
            emissiveIntensity={isSolar ? 1.0 : 0.2}
          />
        </mesh>
        {/* Utility / Grid Source Green Pilot Light (Right) */}
        <mesh position={[0.15, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          <meshStandardMaterial
            color="#10B981"
            emissive="#10B981"
            emissiveIntensity={isUtility ? 1.0 : 0.2}
          />
        </mesh>
      </group>

      {/* Industrial Rotary Transfer Switch Assembly */}
      <group position={[0, -0.06, 0.235]}>
        {/* Outer Chrome / Aluminum Bezel Trim Ring */}
        <mesh position={[0, 0, 0.002]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.265, 0.265, 0.012, 36]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Circular Switch Escutcheon Faceplate (Dark Industrial Anodized Finish) */}
        <mesh position={[0, 0, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.016, 36]} />
          <meshStandardMaterial color="#0F172A" metalness={0.35} roughness={0.4} />
        </mesh>

        {/* Neutral Index Mark (12 o'clock / Top Center) */}
        <mesh position={[0, 0.17, 0.017]}>
          <boxGeometry args={[0.008, 0.028, 0.005]} />
          <meshStandardMaterial color="#64748B" roughness={0.3} />
        </mesh>

        {/* --- SOLAR SOURCE INDICATOR (TOP-LEFT / -45 DEG) --- */}
        <group position={[-0.13, 0.13, 0.017]}>
          {/* Angular Index Detent Tick (pointing toward center) */}
          <mesh position={[0.02, -0.02, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.008, 0.028, 0.005]} />
            <meshStandardMaterial color={isSolar ? '#F59E0B' : '#64748B'} />
          </mesh>

          {/* Solar Pilot LED Indicator Dot */}
          <group position={[-0.01, 0.03, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.008, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.004]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.008, 16]} />
              <meshStandardMaterial
                color="#F59E0B"
                emissive="#F59E0B"
                emissiveIntensity={isSolar ? 1.4 : 0.25}
              />
            </mesh>
          </group>

          {/* 3D Graphical Solar Sun Icon (NO WORDS) */}
          <group position={[-0.01, -0.045, 0]}>
            {/* Central Sun Disc */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.005, 16]} />
              <meshStandardMaterial
                color="#F59E0B"
                emissive="#F59E0B"
                emissiveIntensity={isSolar ? 0.6 : 0.15}
              />
            </mesh>
            {/* 8 Radial Sun Rays */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const r = 0.024;
              return (
                <mesh
                  key={`ray-left-${deg}`}
                  position={[Math.cos(rad) * r, Math.sin(rad) * r, 0]}
                  rotation={[0, 0, rad + Math.PI / 2]}
                >
                  <boxGeometry args={[0.003, 0.009, 0.004]} />
                  <meshStandardMaterial
                    color={isSolar ? '#FBBF24' : '#D97706'}
                    emissive={isSolar ? '#FBBF24' : '#000000'}
                    emissiveIntensity={isSolar ? 0.4 : 0}
                  />
                </mesh>
              );
            })}
          </group>
        </group>

        {/* --- UTILITY SOURCE INDICATOR (TOP-RIGHT / +45 DEG) --- */}
        <group position={[0.13, 0.13, 0.017]}>
          {/* Angular Index Detent Tick (pointing toward center) */}
          <mesh position={[-0.02, -0.02, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.008, 0.028, 0.005]} />
            <meshStandardMaterial color={isUtility ? '#10B981' : '#64748B'} />
          </mesh>

          {/* Utility Pilot LED Indicator Dot */}
          <group position={[0.01, 0.03, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.008, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.004]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.008, 16]} />
              <meshStandardMaterial
                color="#10B981"
                emissive="#10B981"
                emissiveIntensity={isUtility ? 1.4 : 0.25}
              />
            </mesh>
          </group>

          {/* 3D Graphical Power Pylon / Utility Grid Icon (NO WORDS) */}
          <group position={[0.01, -0.045, 0]}>
            {/* Central Vertical Pylon Mast */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.006, 0.05, 0.004]} />
              <meshStandardMaterial color={isUtility ? '#F8FAFC' : '#94A3B8'} />
            </mesh>
            {/* Upper Crossarm */}
            <mesh position={[0, 0.012, 0]}>
              <boxGeometry args={[0.038, 0.005, 0.004]} />
              <meshStandardMaterial color={isUtility ? '#F8FAFC' : '#94A3B8'} />
            </mesh>
            {/* Lower Crossarm */}
            <mesh position={[0, -0.004, 0]}>
              <boxGeometry args={[0.048, 0.005, 0.004]} />
              <meshStandardMaterial color={isUtility ? '#F8FAFC' : '#94A3B8'} />
            </mesh>
            {/* Left/Right Diagonal Braces */}
            <mesh position={[-0.014, -0.016, 0]} rotation={[0, 0, 0.35]}>
              <boxGeometry args={[0.004, 0.024, 0.004]} />
              <meshStandardMaterial color={isUtility ? '#F8FAFC' : '#94A3B8'} />
            </mesh>
            <mesh position={[0.014, -0.016, 0]} rotation={[0, 0, -0.35]}>
              <boxGeometry args={[0.004, 0.024, 0.004]} />
              <meshStandardMaterial color={isUtility ? '#F8FAFC' : '#94A3B8'} />
            </mesh>
          </group>
        </group>

        {/* Central Rotary Hub Base Collar (Stainless / Anodized Gunmetal) */}
        <mesh position={[0, 0, 0.022]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.12, 0.02, 24]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Rotary Switch Handle Assembly (Rotates to selected position, Clickable) */}
        <group
          ref={dialRef}
          position={[0, 0, 0.034]}
          rotation={[0, 0, targetRotation]}
          onClick={(e) => {
            e.stopPropagation();
            toggleAtsSource();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          {/* Rotary Knob Cylindrical Core (Dark Charcoal / Graphite `#1E293B`, distinct from red isolator) */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.095, 0.06, 24]} />
            <meshStandardMaterial color="#1E293B" metalness={0.4} roughness={0.3} />
          </mesh>

          {/* Molded Industrial Selector Grip Handle (Anthracite `#334155`) */}
          <mesh position={[0, 0.06, 0.045]}>
            <boxGeometry args={[0.075, 0.22, 0.09]} />
            <meshStandardMaterial color="#334155" metalness={0.3} roughness={0.35} />
          </mesh>

          {/* Grip Ridges / Fluting Details on Handle Sides */}
          {[-0.04, 0.04].map((rx, rIdx) => (
            <mesh key={`ridge-${rIdx}`} position={[rx, 0.05, 0.045]}>
              <boxGeometry args={[0.005, 0.16, 0.07]} />
              <meshStandardMaterial color="#1E293B" roughness={0.4} />
            </mesh>
          ))}

          {/* High-Contrast White Pointer Spine Stripe */}
          <mesh position={[0, 0.07, 0.092]}>
            <boxGeometry args={[0.012, 0.17, 0.004]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.1} roughness={0.2} />
          </mesh>

          {/* High-Contrast White Triangle Arrow Pointer Tip */}
          <mesh position={[0, 0.19, 0.045]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.038, 0.06, 3]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.1} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function NodeGeometry({
  nodeType: rawNodeType,
  nodeKey,
  isSelected = false,
  isHovered = false,
  color = '#D97706',
  isStandalone = false,
}: NodeGeometryProps) {
  const nodeType: NodeType = rawNodeType || (nodeKey ? getNodeTypeFromKey(nodeKey) : 'breaker');

  switch (nodeType) {
    case 'pv':
      return (
        <group>
          {/* 1. 3x Forward-Facing Monocrystalline Solar Modules Array Table */}
          {[-1.3, 0, 1.3].map((modX, modIdx) => (
            <group key={`pv-mod-${modIdx}`} position={[modX, 0.067, 0]}>
              {/* Module Aluminum Outer Frame (Tilted Forward Facing Camera: rotation 0.38 rad) */}
              <mesh rotation={[0.38, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 0.05, 1.68]} />
                <meshStandardMaterial color="#CBD5E1" metalness={0.88} roughness={0.22} />
              </mesh>
              {/* Module Miter Seam Perimeter Accent */}
              <mesh position={[0, 0.026, 0]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[1.18, 0.005, 1.66]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} wireframe />
              </mesh>
              {/* Deep Blue Monocrystalline Solar Cell Wafers */}
              <mesh position={[0, 0.028, 0]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[1.15, 0.01, 1.63]} />
                <meshStandardMaterial
                  color={isSelected || isHovered ? '#0284C7' : '#0B192C'}
                  roughness={0.12}
                  metalness={0.65}
                />
              </mesh>
              {/* Silver Multi-Busbar Solar Cell Grid Traces */}
              <mesh position={[0, 0.034, 0]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[1.13, 0.004, 1.59]} />
                <meshStandardMaterial color="#E2E8F0" wireframe transparent opacity={0.35} />
              </mesh>
            </group>
          ))}

          {/* 2. Continuous Extruded Aluminum Mounting Racking Rails (Underneath Modules) */}
          {/* Front Rail */}
          <mesh position={[0, -0.15, 0.45]} rotation={[0.38, 0, 0]} castShadow>
            <boxGeometry args={[3.92, 0.05, 0.08]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.86} roughness={0.25} />
          </mesh>
          {/* Rear Rail */}
          <mesh position={[0, 0.184, -0.45]} rotation={[0.38, 0, 0]} castShadow>
            <boxGeometry args={[3.92, 0.05, 0.08]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.86} roughness={0.25} />
          </mesh>

          {/* 3. Solar Module Inter-Panel Mid-Clamps (Between Modules 1-2 and 2-3) */}
          {[-0.65, 0.65].map((cx, cIdx) => (
            <group key={`mc-${cIdx}`} position={[cx, 0, 0]}>
              <mesh position={[0, -0.13, 0.45]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[0.06, 0.04, 0.05]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0.204, -0.45]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[0.06, 0.04, 0.05]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}

          {/* 4. Solar Module End-Clamps (Outer Racking Edges) */}
          {[-1.92, 1.92].map((ex, eIdx) => (
            <group key={`ec-${eIdx}`} position={[ex, 0, 0]}>
              <mesh position={[0, -0.13, 0.45]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[0.05, 0.04, 0.05]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0.204, -0.45]} rotation={[0.38, 0, 0]}>
                <boxGeometry args={[0.05, 0.04, 0.05]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}

          {/* 5. 3x Heavy-Duty Triangular A-Frame Racking Stanchions Anchored to Floor */}
          {[-1.3, 0.0, 1.3].map((legX, lIdx) => (
            <group key={`leg-${lIdx}`} position={[legX, 0, 0]}>
              {/* Concrete Footing Pads */}
              <mesh position={[0, -0.72, 0.45]} receiveShadow>
                <boxGeometry args={[0.28, 0.06, 0.28]} />
                <meshStandardMaterial color="#94A3B8" roughness={0.85} metalness={0.12} />
              </mesh>
              <mesh position={[0, -0.72, -0.45]} receiveShadow>
                <boxGeometry args={[0.28, 0.06, 0.28]} />
                <meshStandardMaterial color="#94A3B8" roughness={0.85} metalness={0.12} />
              </mesh>

              {/* Galvanized Base Mounting Flanges / L-Feet on top of Footing Pad */}
              <mesh position={[0, -0.684, 0.45]}>
                <boxGeometry args={[0.16, 0.012, 0.16]} />
                <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.22} />
              </mesh>
              <mesh position={[0, -0.684, -0.45]}>
                <boxGeometry args={[0.16, 0.012, 0.16]} />
                <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.22} />
              </mesh>

              {/* Front Low Strut Post */}
              <mesh position={[0, -0.415, 0.45]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 0.53, 12]} />
                <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.25} />
              </mesh>

              {/* Rear Elevated Strut Post */}
              <mesh position={[0, -0.248, -0.45]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 0.864, 12]} />
                <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.25} />
              </mesh>

              {/* Structural Diagonal Cross Sway Brace */}
              <mesh position={[0, -0.248, 0.0]} rotation={[-0.8, 0, 0]} castShadow>
                <cylinderGeometry args={[0.025, 0.025, 1.08, 8]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.28} />
              </mesh>
            </group>
          ))}

          {/* 6. Weatherproof String Combiner / DC Junction Box Mounted to Center Rear Rail */}
          <group position={[0, 0.184, -0.52]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.36, 0.26, 0.14]} />
              <meshStandardMaterial color="#F1F5F9" metalness={0.25} roughness={0.3} />
            </mesh>
            {/* Conduit Adapter Fitting for DC Homerun */}
            <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 0.08, 12]} />
              <meshStandardMaterial color="#D97706" metalness={0.85} />
            </mesh>
          </group>
        </group>
      );

    case 'isolator':
      return (
        <group>
          {/* Heavy-duty IP66 Weatherproof Polycarbonate Enclosure */}
          <RoundedBox args={[0.85, 1.05, 0.42]} radius={0.035} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color="#E2E8F0" roughness={0.35} metalness={0.12} />
          </RoundedBox>

          {/* Enclosure Cover Gasket Seal Rim */}
          <mesh position={[0, 0, 0.205]}>
            <boxGeometry args={[0.83, 1.03, 0.015]} />
            <meshStandardMaterial color="#1E293B" roughness={0.7} />
          </mesh>

          {/* 4x Corner Captive Stainless Fasteners with Cross Heads */}
          {[
            [-0.36, 0.46],
            [0.36, 0.46],
            [-0.36, -0.46],
            [0.36, -0.46],
          ].map(([sx, sy], idx) => (
            <group key={`sc-${idx}`} position={[sx, sy, 0.215]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.022, 0.022, 0.01, 16]} />
                <meshStandardMaterial color="#CBD5E1" metalness={0.88} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0, 0.006]}>
                <boxGeometry args={[0.025, 0.005, 0.005]} />
                <meshStandardMaterial color="#64748B" metalness={0.8} />
              </mesh>
            </group>
          ))}

          {/* Top & Bottom Unistrut Mounting Ears */}
          <mesh position={[0, 0.55, -0.05]}>
            <boxGeometry args={[0.3, 0.06, 0.02]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.55, -0.05]}>
            <boxGeometry args={[0.3, 0.06, 0.02]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.25} />
          </mesh>

          {/* High-Visibility Safety Yellow Faceplate */}
          <RoundedBox args={[0.62, 0.78, 0.02]} radius={0.02} smoothness={4} position={[0, 0.02, 0.22]}>
            <meshStandardMaterial color="#F59E0B" roughness={0.3} metalness={0.08} />
          </RoundedBox>

          {/* Circular Switch Escutcheon Ring */}
          <mesh position={[0, 0.08, 0.235]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.02, 32]} />
            <meshStandardMaterial color="#0F172A" roughness={0.3} />
          </mesh>

          {/* Position Markings: ON ("I") at 12 o'clock, OFF ("0") at 9 o'clock */}
          <mesh position={[0, 0.29, 0.245]}>
            <boxGeometry args={[0.04, 0.012, 0.005]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[-0.21, 0.08, 0.245]}>
            <boxGeometry args={[0.012, 0.04, 0.005]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>

          {/* Yellow Padlock Lockout/Tagout (LOTO) Hasp Ring */}
          <mesh position={[0, 0.08, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.035, 24]} />
            <meshStandardMaterial color="#EAB308" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.08, 0.265]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
            <meshStandardMaterial color="#0F172A" />
          </mesh>

          {/* 3D Molded Industrial Red Switch Handle (Turned to ON) */}
          <mesh position={[0, 0.08, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.13, 0.08, 24]} />
            <meshStandardMaterial color="#DC2626" roughness={0.28} metalness={0.08} />
          </mesh>
          {/* Ribbed Ergonomic Pointer Grip Handle */}
          <mesh position={[0, 0.12, 0.36]}>
            <boxGeometry args={[0.09, 0.34, 0.12]} />
            <meshStandardMaterial color="#B91C1C" roughness={0.25} />
          </mesh>
          {/* Pointer Triangle Tip */}
          <mesh position={[0, 0.31, 0.36]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.05, 0.08, 3]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>

          {/* High Voltage Arc Flash Hazard Decal */}
          <group position={[0, -0.24, 0.235]}>
            <mesh>
              <boxGeometry args={[0.38, 0.14, 0.005]} />
              <meshStandardMaterial color="#0F172A" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.003]}>
              <boxGeometry args={[0.36, 0.12, 0.005]} />
              <meshStandardMaterial color="#FEF08A" roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.006]}>
              <boxGeometry args={[0.28, 0.03, 0.005]} />
              <meshStandardMaterial color="#DC2626" />
            </mesh>
          </group>

          {/* Bottom Cable Gland Hub Entry */}
          <group position={[0, -0.56, 0]}>
            <mesh position={[-0.15, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.08, 16]} />
              <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.2} />
            </mesh>
            <mesh position={[0.15, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.08, 16]} />
              <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.2} />
            </mesh>
          </group>
        </group>
      );

    case 'breaker':
      return (
        <group>
          {/* Modular DIN Rail Enclosure Casing */}
          <RoundedBox args={[0.78, 0.98, 0.44]} radius={0.03} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.3} metalness={0.12} />
          </RoundedBox>

          {/* Recessed Window Housing Frame */}
          <mesh position={[0, 0.08, 0.16]}>
            <boxGeometry args={[0.66, 0.6, 0.12]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.4} />
          </mesh>

          {/* Galvanized Steel Top-Hat DIN Rail Track Inside Window */}
          <mesh position={[0, 0.08, 0.13]}>
            <boxGeometry args={[0.6, 0.04, 0.02]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.88} roughness={0.22} />
          </mesh>

          {/* DIN Miniature Circuit Breaker (MCB) Multi-Pole Modules */}
          {[-0.12, 0.12].map((bx, bIdx) => (
            <group key={`mcb-${bIdx}`} position={[bx, 0.08, 0.18]}>
              {/* Breaker Module Molded Plastic Body */}
              <RoundedBox args={[0.22, 0.48, 0.16]} radius={0.015} smoothness={4}>
                <meshStandardMaterial color="#E2E8F0" roughness={0.35} />
              </RoundedBox>
              {/* Mechanical Trip Flag Window (Live Red Indicator) */}
              <mesh position={[0, 0.15, 0.085]}>
                <boxGeometry args={[0.06, 0.04, 0.005]} />
                <meshStandardMaterial color="#DC2626" />
              </mesh>
              {/* Molded Rocker Toggle Switch (In UP / ON Position) */}
              <mesh position={[0, 0.02, 0.1]} rotation={[-0.3, 0, 0]}>
                <boxGeometry args={[0.08, 0.16, 0.06]} />
                <meshStandardMaterial
                  color={
                    nodeKey === 'dc_breaker'
                      ? '#DC2626'
                      : nodeKey === 'battery_breaker'
                        ? '#059669'
                        : '#0284C7'
                  }
                  roughness={0.3}
                />
              </mesh>
              {/* Top & Bottom Cage Terminal Clamp Screws */}
              <mesh position={[0, 0.2, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.01, 12]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.9} />
              </mesh>
              <mesh position={[0, -0.2, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.01, 12]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.9} />
              </mesh>
            </group>
          ))}

          {/* Battery Breaker Heavy-Duty Tie Bar Handle */}
          {nodeKey === 'battery_breaker' && (
            <mesh position={[0, 0.1, 0.3]}>
              <boxGeometry args={[0.32, 0.04, 0.03]} />
              <meshStandardMaterial color="#059669" roughness={0.3} />
            </mesh>
          )}

          {/* Smoked Transparent Polycarbonate Flip-up Inspection Window */}
          <RoundedBox args={[0.62, 0.56, 0.03]} radius={0.015} smoothness={4} position={[0, 0.08, 0.23]}>
            <meshStandardMaterial
              color="#0F172A"
              transparent
              opacity={0.45}
              roughness={0.08}
              metalness={0.2}
            />
          </RoundedBox>

          {/* Laser-Etched Rating Text Badge below Window */}
          <mesh position={[0, -0.32, 0.222]}>
            <boxGeometry args={[0.54, 0.12, 0.005]} />
            <meshStandardMaterial color="#1E293B" roughness={0.4} />
          </mesh>

          {/* Top & Bottom Unistrut Mounting Cleats */}
          <mesh position={[0, 0.51, -0.05]}>
            <boxGeometry args={[0.3, 0.04, 0.02]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.51, -0.05]}>
            <boxGeometry args={[0.3, 0.04, 0.02]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      );

    case 'spd':
      return (
        <group>
          {/* Modular DIN Rail SPD Enclosure */}
          <RoundedBox args={[0.78, 0.95, 0.44]} radius={0.03} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.3} metalness={0.12} />
          </RoundedBox>

          {/* 2x Pluggable MOV Surge Arrester Cartridges */}
          {[-0.18, 0.18].map((cx, cIdx) => (
            <group key={`spd-cart-${cIdx}`} position={[cx, 0.06, 0.16]}>
              {/* Cartridge Main Housing Block */}
              <RoundedBox args={[0.26, 0.56, 0.22]} radius={0.02} smoothness={4}>
                <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.08} />
              </RoundedBox>
              {/* Optical Status Window (Vivid Emerald Green = Healthy MOV Protection) */}
              <mesh position={[0, 0.12, 0.115]}>
                <boxGeometry args={[0.12, 0.08, 0.005]} />
                <meshStandardMaterial
                  color="#10B981"
                  emissive="#10B981"
                  emissiveIntensity={0.85}
                  roughness={0.2}
                />
              </mesh>
              {/* Lightning Bolt Symbol Plate */}
              <mesh position={[0, -0.06, 0.115]}>
                <boxGeometry args={[0.14, 0.14, 0.005]} />
                <meshStandardMaterial color="#1E293B" roughness={0.4} />
              </mesh>
              {/* Cartridge Removal Ejector Clip */}
              <mesh position={[0, -0.22, 0.1]}>
                <boxGeometry args={[0.18, 0.04, 0.03]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.8} />
              </mesh>
            </group>
          ))}

          {/* Bottom Liquid-Tight Cable Gland / Conduit Entry Fitting */}
          <group position={[0, -0.485, 0.1]}>
            {/* Hexagonal Locking Nut */}
            <mesh>
              <cylinderGeometry args={[0.045, 0.045, 0.018, 6]} />
              <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.25} />
            </mesh>
            {/* Threaded Compression Gland Body */}
            <mesh position={[0, -0.015, 0]}>
              <cylinderGeometry args={[0.034, 0.038, 0.024, 16]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Neoprene Cable Sealing Collar */}
            <mesh position={[0, -0.028, 0]}>
              <cylinderGeometry args={[0.026, 0.026, 0.012, 16]} />
              <meshStandardMaterial color="#1E293B" roughness={0.6} />
            </mesh>
          </group>

          {/* Surge Arrester Technical Specification Badge */}
          <mesh position={[0, -0.32, 0.222]}>
            <boxGeometry args={[0.54, 0.1, 0.005]} />
            <meshStandardMaterial color="#0F172A" roughness={0.4} />
          </mesh>
        </group>
      );

    case 'inverter':
      return (
        <group>
          {/* Precision Front Powder-Coated Aluminum Inverter Casing (Height 1.76m) */}
          <RoundedBox args={[1.56, 1.76, 0.44]} radius={0.045} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial
              color={isSelected || isHovered ? '#FFFFFF' : '#F8FAFC'}
              roughness={0.22}
              metalness={0.18}
            />
          </RoundedBox>

          {/* Brushed Aluminum Perimeter Bevel Rim */}
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[1.58, 1.78, 0.02]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.75} roughness={0.2} />
          </mesh>

          {/* Rear Extruded Aluminum Heatsink Cooling Fins (Left & Right Sides) */}
          {[-0.78, 0.78].map((sideX, sideIdx) => (
            <group key={`side-heatsink-${sideIdx}`} position={[sideX, 0, -0.1]}>
              {Array.from({ length: 8 }).map((_, finIdx) => (
                <mesh
                  key={`fin-${finIdx}`}
                  position={[sideX < 0 ? 0.04 : -0.04, 0, (finIdx - 3.5) * 0.05]}
                >
                  <boxGeometry args={[0.015, 1.55, 0.035]} />
                  <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.25} />
                </mesh>
              ))}
            </group>
          ))}

          {/* Top Air Exhaust Ventilation Louvers */}
          <mesh position={[0, 0.86, 0]}>
            <boxGeometry args={[1.2, 0.06, 0.32]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Front Fascia: Recessed Obsidian Glass Display Bezel */}
          <RoundedBox args={[1.1, 0.76, 0.02]} radius={0.02} smoothness={4} position={[0, 0.28, 0.225]}>
            <meshStandardMaterial color="#0A0F1D" roughness={0.1} metalness={0.3} />
          </RoundedBox>

          {/* Backlit High-Definition LCD Telemetry Screen */}
          <mesh position={[0, 0.3, 0.237]}>
            <planeGeometry args={[0.96, 0.54]} />
            <meshStandardMaterial color="#030712" roughness={0.05} />
          </mesh>

          {/* Telemetry LCD UI Graphics: Solar PV Input Line */}
          <mesh position={[-0.22, 0.44, 0.239]}>
            <planeGeometry args={[0.42, 0.08]} />
            <meshStandardMaterial
              color="#F59E0B"
              emissive="#F59E0B"
              emissiveIntensity={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Telemetry LCD UI Graphics: Inverter AC Power Output Line */}
          <mesh position={[0.22, 0.44, 0.239]}>
            <planeGeometry args={[0.42, 0.08]} />
            <meshStandardMaterial
              color="#38BDF8"
              emissive="#38BDF8"
              emissiveIntensity={0.85}
              roughness={0.2}
            />
          </mesh>

          {/* Telemetry LCD Center Waveform / Energy Bridge Graphic */}
          <mesh position={[0, 0.3, 0.239]}>
            <planeGeometry args={[0.82, 0.1]} />
            <meshStandardMaterial
              color="#10B981"
              emissive="#10B981"
              emissiveIntensity={0.7}
              roughness={0.2}
            />
          </mesh>

          {/* Telemetry LCD Bottom Status Line (Grid Frequency & Efficiency) */}
          <mesh position={[0, 0.16, 0.239]}>
            <planeGeometry args={[0.86, 0.06]} />
            <meshStandardMaterial
              color="#94A3B8"
              emissive="#38BDF8"
              emissiveIntensity={0.4}
              roughness={0.2}
            />
          </mesh>

          {/* Status Micro-LED Cluster (Below LCD Screen) */}
          {[
            { x: -0.3, label: 'PWR', color: '#10B981', active: true },
            { x: -0.1, label: 'INV', color: '#38BDF8', active: true },
            { x: 0.1, label: 'COMM', color: '#F59E0B', active: true },
            { x: 0.3, label: 'ALARM', color: '#64748B', active: false },
          ].map((led, lIdx) => (
            <group key={`led-${lIdx}`} position={[led.x, 0.02, 0.23]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.022, 0.022, 0.01, 16]} />
                <meshStandardMaterial
                  color={led.color}
                  emissive={led.active ? led.color : '#000000'}
                  emissiveIntensity={led.active ? 1.0 : 0}
                  roughness={0.2}
                />
              </mesh>
            </group>
          ))}

          {/* Rotary DC Disconnect Switch (Lower Left Front) */}
          <group position={[-0.48, -0.34, 0.22]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.02, 24]} />
              <meshStandardMaterial color="#FBBF24" />
            </mesh>
            <mesh position={[0, 0, 0.025]}>
              <boxGeometry args={[0.04, 0.14, 0.05]} />
              <meshStandardMaterial color="#DC2626" />
            </mesh>
          </group>

          {/* Brand Logo Plate (Brushed Titanium Badge) */}
          <mesh position={[0.15, -0.34, 0.222]}>
            <boxGeometry args={[0.6, 0.12, 0.005]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.25} />
          </mesh>

          {/* Bottom Connection Hub (MC4 Solar Inputs & Terminal Ports) */}
          <group position={[0, -0.86, 0]}>
            {/* Terminal Plate */}
            <mesh>
              <boxGeometry args={[1.2, 0.06, 0.32]} />
              <meshStandardMaterial color="#1E293B" roughness={0.4} />
            </mesh>
            {/* 4x MC4 PV Connectors */}
            {[-0.35, -0.25, -0.15, -0.05].map((mcX, mcIdx) => (
              <mesh key={`mc-${mcIdx}`} position={[mcX, -0.05, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.08, 12]} />
                <meshStandardMaterial color="#0F172A" roughness={0.3} />
              </mesh>
            ))}
            {/* AC Conduit Output Hub */}
            <mesh position={[0.3, -0.05, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.08, 16]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.2} />
            </mesh>
          </group>

          {/* Stainless Wall Mounting Cleats (Fixing to Upper & Lower Unistruts) */}
          <mesh position={[0, 0.78, -0.22]}>
            <boxGeometry args={[1.4, 0.06, 0.04]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.72, -0.22]}>
            <boxGeometry args={[1.4, 0.06, 0.04]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      );

    case 'battery':
      return (
        <group>
          {/* Satin Architectural White Battery Powerwall Enclosure (Height 1.56m) */}
          <RoundedBox args={[1.38, 1.56, 0.52]} radius={0.04} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial
              color={isSelected || isHovered ? '#FFFFFF' : '#F8FAFC'}
              roughness={0.22}
              metalness={0.18}
            />
          </RoundedBox>

          {/* Dark Anthracite Perimeter Side Heat-Dissipation Frames */}
          <mesh position={[-0.7, 0, 0]}>
            <boxGeometry args={[0.04, 1.54, 0.5]} />
            <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.3} />
          </mesh>
          <mesh position={[0.7, 0, 0]}>
            <boxGeometry args={[0.04, 1.54, 0.5]} />
            <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.3} />
          </mesh>

          {/* Multi-Segment LED State of Charge (SOC) Light Bar */}
          <group position={[0, 0.4, 0.265]}>
            {/* Recessed Channel Slot */}
            <mesh>
              <boxGeometry args={[0.96, 0.08, 0.015]} />
              <meshStandardMaterial color="#0F172A" roughness={0.5} />
            </mesh>
            {/* 10 Precision LED Capacity Segments */}
            {Array.from({ length: 10 }).map((_, sIdx) => (
              <mesh key={`soc-${sIdx}`} position={[(sIdx - 4.5) * 0.088, 0, 0.008]}>
                <boxGeometry args={[0.065, 0.045, 0.008]} />
                <meshStandardMaterial
                  color="#10B981"
                  emissive="#10B981"
                  emissiveIntensity={1.2}
                  roughness={0.15}
                />
              </mesh>
            ))}
          </group>

          {/* Heavy-Duty DC High-Current Terminal Studs (Red Positive / Black Negative) */}
          <group position={[-0.45, 0.78, 0]}>
            {/* Red Positive Stud Boot */}
            <mesh>
              <cylinderGeometry args={[0.05, 0.05, 0.08, 16]} />
              <meshStandardMaterial color="#DC2626" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.04, 12]} />
              <meshStandardMaterial color="#D97706" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
          <group position={[-0.25, 0.78, 0]}>
            {/* Black Negative Stud Boot */}
            <mesh>
              <cylinderGeometry args={[0.05, 0.05, 0.08, 16]} />
              <meshStandardMaterial color="#0F172A" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.04, 12]} />
              <meshStandardMaterial color="#D97706" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>

          {/* Master Rocker Power Switch with Illuminated Ring */}
          <group position={[0.45, 0.78, 0]}>
            <mesh>
              <cylinderGeometry args={[0.045, 0.045, 0.03, 16]} />
              <meshStandardMaterial
                color="#10B981"
                emissive="#10B981"
                emissiveIntensity={0.8}
              />
            </mesh>
          </group>

          {/* Battery Storage Spec Placard (Lithium Iron Phosphate LiFePO4) */}
          <mesh position={[0, -0.35, 0.262]}>
            <boxGeometry args={[0.7, 0.16, 0.005]} />
            <meshStandardMaterial color="#1E293B" roughness={0.4} />
          </mesh>
        </group>
      );

    case 'ats':
      return <AtsNodeGeometry isSelected={isSelected} isHovered={isHovered} />;

    case 'panel':
      return (
        <group>
          {/* Heavy-Duty ANSI 61 Gray Powder-Coated Cabinet */}
          <RoundedBox args={[1.15, 1.65, 0.44]} radius={0.03} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color="#64748B" metalness={0.65} roughness={0.32} />
          </RoundedBox>

          {/* Flush Door Seam with Piano Hinge on Left */}
          <mesh position={[0, 0, 0.215]}>
            <boxGeometry args={[1.05, 1.54, 0.02]} />
            <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[-0.53, 0, 0.215]}>
            <cylinderGeometry args={[0.015, 0.015, 1.5, 12]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Chrome Flush Slam-Latch Handle */}
          <group position={[0.42, 0, 0.23]}>
            <mesh>
              <boxGeometry args={[0.05, 0.22, 0.02]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.92} roughness={0.15} />
            </mesh>
            <mesh position={[0, -0.04, 0.015]}>
              <boxGeometry args={[0.03, 0.12, 0.02]} />
              <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.12} />
            </mesh>
          </group>

          {/* Triangular Electrical Hazard Placard ("DANGER LIVE BUSBAR") */}
          <group position={[0, 0.42, 0.23]} rotation={[0, 0, Math.PI]}>
            <mesh>
              <coneGeometry args={[0.16, 0.26, 3]} />
              <meshStandardMaterial color="#FBBF24" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.005]}>
              <boxGeometry args={[0.025, 0.1, 0.005]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
          </group>

          {/* Circuit Directory Document Holder on Lower Door */}
          <mesh position={[0, -0.38, 0.23]}>
            <boxGeometry args={[0.65, 0.38, 0.01]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.4} transparent opacity={0.85} />
          </mesh>
        </group>
      );

    case 'grounding': {
      const busbarWidth = 0.62; // Standard 24" (600 mm) UL 467 Master Ground Busbar
      const busbarHeight = 0.10; // 4" (100 mm) height
      const busbarThickness = 0.012; // 1/2" thick solid electrolytic copper
      const standoffXs = [-0.22, 0.22];
      const lugPositions = [-0.22, -0.13, -0.04, 0.05, 0.14, 0.22];

      return (
        <group>
          {/* 1. Solid Polished Electrolytic Copper Busbar Plate (UL 467 Listed) */}
          <mesh position={[0, 0, 0.012]} castShadow receiveShadow>
            <boxGeometry args={[busbarWidth, busbarHeight, busbarThickness]} />
            <meshStandardMaterial
              color={isSelected || isHovered ? '#EA580C' : '#B45309'}
              metalness={0.96}
              roughness={0.16}
            />
          </mesh>

          {/* Busbar Perimeter Bevel Lip Accent */}
          <mesh position={[0, 0, 0.018]}>
            <boxGeometry args={[busbarWidth - 0.01, busbarHeight - 0.01, 0.002]} />
            <meshStandardMaterial
              color="#D97706"
              metalness={0.92}
              roughness={0.2}
              wireframe
            />
          </mesh>

          {/* 2. Red Polyester/Fiberglass Standoff Insulators & Wall Brackets */}
          {standoffXs.map((sx, sIdx) => (
            <group key={`ins-${sIdx}`} position={[sx, 0, -0.015]}>
              {/* Cylindrical Ribbed Red Standoff Insulator */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.024, 0.024, 0.042, 12]} />
                <meshStandardMaterial color="#DC2626" roughness={0.35} metalness={0.1} />
              </mesh>
              {/* Stainless Steel Wall Standoff Base Bracket */}
              <mesh position={[0, 0, -0.02]}>
                <boxGeometry args={[0.046, 0.08, 0.008]} />
                <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.25} />
              </mesh>
              {/* Lag Bolts attaching to wall */}
              {[-0.028, 0.028].map((ly, lIdx) => (
                <mesh key={`lag-${lIdx}`} position={[0, ly, -0.018]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.006, 0.006, 0.012, 6]} />
                  <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
                </mesh>
              ))}
            </group>
          ))}

          {/* 3. Dual-Hole Tin-Plated Grounding Lugs with Stainless Steel Hardware */}
          {lugPositions.map((lx, lIdx) => (
            <group key={`lug-${lx}`} position={[lx, 0, 0.026]}>
              {/* Mechanical Compression Lug Body */}
              <mesh>
                <boxGeometry args={[0.038, 0.052, 0.024]} />
                <meshStandardMaterial color="#D97706" metalness={0.92} roughness={0.22} />
              </mesh>
              {/* Dual Clamping Hex Bolts */}
              {[-0.014, 0.014].map((by, bIdx) => (
                <mesh key={`bolt-${bIdx}`} position={[0, by, 0.013]}>
                  <cylinderGeometry args={[0.009, 0.009, 0.012, 6]} />
                  <meshStandardMaterial color="#CBD5E1" metalness={0.92} roughness={0.18} />
                </mesh>
              ))}
              {/* Conductor Tap Leads (Green / Yellow Equipment Grounding Leads) */}
              {lIdx % 2 === 0 && (
                <group position={[0, 0.08, -0.005]}>
                  <mesh>
                    <cylinderGeometry args={[0.008, 0.008, 0.12, 12]} />
                    <meshStandardMaterial color="#10B981" roughness={0.3} />
                  </mesh>
                </group>
              )}
            </group>
          ))}

          {/* 4. Downward Rigid Earth Grounding Electrode Conduit & Floor Sleeve (Scene View) */}
          {!isStandalone && (
            <group position={[0, 0, 0]}>
              {/* Solid Bare Copper Grounding Electrode Conductor (GEC) from central lug */}
              <mesh position={[0, -0.06, 0.02]}>
                <cylinderGeometry args={[0.008, 0.008, 0.07, 12]} />
                <meshStandardMaterial color="#B45309" metalness={0.95} roughness={0.16} />
              </mesh>

              {/* Conduit Entry Grounding Bushing Hub */}
              <mesh position={[0, -0.10, 0.005]}>
                <cylinderGeometry args={[0.026, 0.026, 0.025, 16]} />
                <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.22} />
              </mesh>

              {/* Vertical EMT / Steel Conduit Pipe down to Concrete Floor */}
              <mesh position={[0, -0.425, 0.005]}>
                <cylinderGeometry args={[0.020, 0.020, 0.65, 20]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.88} roughness={0.20} />
              </mesh>

              {/* Conduit Wall Straps anchoring the pipe */}
              <group position={[0, -0.42, 0.005]}>
                <mesh>
                  <cylinderGeometry args={[0.028, 0.028, 0.035, 16]} />
                  <meshStandardMaterial color="#64748B" metalness={0.85} roughness={0.25} />
                </mesh>
                <mesh position={[0, 0, -0.015]}>
                  <boxGeometry args={[0.08, 0.035, 0.01]} />
                  <meshStandardMaterial color="#475569" metalness={0.85} />
                </mesh>
              </group>

              {/* Concrete Floor Penetration Collar at Foundation Level (Y = -0.74m) */}
              <group position={[0, -0.74, 0.005]}>
                <mesh>
                  <cylinderGeometry args={[0.045, 0.052, 0.025, 16]} />
                  <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
                </mesh>
                {/* Foundation Grounding Pit Identification Ring */}
                <mesh position={[0, 0.015, 0]}>
                  <cylinderGeometry args={[0.032, 0.032, 0.008, 16]} />
                  <meshStandardMaterial color="#EAB308" roughness={0.25} />
                </mesh>
              </group>

              {/* 5. Upward Equipment Grounding Bonding Conductor towards Main Panel */}
              <group position={[0.14, 0.44, 0.005]}>
                <mesh>
                  <cylinderGeometry args={[0.009, 0.009, 0.78, 12]} />
                  <meshStandardMaterial color="#10B981" roughness={0.3} />
                </mesh>
              </group>
            </group>
          )}
        </group>
      );
    }

    case 'grid':
      return (
        <group>
          {/* 1. Concrete Pole Foundation Base Collar */}
          <mesh position={[0, -1.54, 0]} receiveShadow>
            <cylinderGeometry args={[0.22, 0.28, 0.12, 16]} />
            <meshStandardMaterial color="#94A3B8" roughness={0.85} metalness={0.15} />
          </mesh>

          {/* Galvanized Anchor Flange Ring on top of collar */}
          <mesh position={[0, -1.47, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
            <meshStandardMaterial color="#64748B" metalness={0.88} roughness={0.25} />
          </mesh>

          {/* 2. Full-Height Treated Utility Service Riser Pole (3.2m tall) */}
          <mesh position={[0, 0.0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.09, 0.15, 3.2, 16]} />
            <meshStandardMaterial color="#64748B" metalness={0.65} roughness={0.35} />
          </mesh>

          {/* 3. Crossarm with Steel Braces at Top */}
          <mesh position={[0, 1.45, 0]} castShadow>
            <boxGeometry args={[1.3, 0.09, 0.09]} />
            <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
          </mesh>

          {/* 4. 3x High-Voltage White Porcelain Bell Insulators */}
          {[-0.5, 0, 0.5].map((ix, iIdx) => (
            <group key={`ins-grid-${iIdx}`} position={[ix, 1.58, 0]}>
              <mesh>
                <cylinderGeometry args={[0.045, 0.055, 0.16, 12]} />
                <meshStandardMaterial color="#F8FAFC" roughness={0.15} metalness={0.1} />
              </mesh>
            </group>
          ))}

          {/* 5. Pole Distribution Transformer Canister */}
          <mesh position={[0.22, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.45, 16]} />
            <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.28} />
          </mesh>

          {/* 6. Weatherproof Revenue Electric Meter Base */}
          <group position={[-0.15, 0.0, 0.1]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.14, 0.2, 0.08]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.02, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.055, 0.055, 0.04, 16]} />
              <meshStandardMaterial color="#BAE6FD" transparent opacity={0.65} roughness={0.1} />
            </mesh>
          </group>

          {/* 7. Vertical Rigid Metallic Conduit Riser from Meter down into Foundation Base */}
          <mesh position={[-0.15, -0.74, 0.08]}>
            <cylinderGeometry args={[0.018, 0.018, 1.48, 12]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.88} roughness={0.2} />
          </mesh>
        </group>
      );

    case 'load':
      return (
        <group>
          {/* 1. Concrete Patio Foundation Pad */}
          <mesh position={[0, -0.76, 0]} receiveShadow>
            <boxGeometry args={[1.7, 0.08, 1.7]} />
            <meshStandardMaterial color="#94A3B8" roughness={0.82} metalness={0.15} />
          </mesh>

          {/* 2. Main Architectural Building Structure */}
          <mesh position={[0, -0.22, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 1.0, 1.5]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.38} metalness={0.08} />
          </mesh>

          {/* 3. Front Facade Warm Cedar Accent Siding */}
          <mesh position={[-0.42, -0.22, 0.756]}>
            <boxGeometry args={[0.52, 0.98, 0.015]} />
            <meshStandardMaterial color="#B45309" roughness={0.55} metalness={0.12} />
          </mesh>

          {/* 4. Contemporary Dark Charcoal Entry Door */}
          <mesh position={[-0.42, -0.34, 0.768]} castShadow>
            <boxGeometry args={[0.34, 0.74, 0.02]} />
            <meshStandardMaterial color="#1E293B" roughness={0.32} metalness={0.2} />
          </mesh>
          {/* Vertical Brushed Stainless Steel Door Handle */}
          <mesh position={[-0.3, -0.34, 0.785]}>
            <cylinderGeometry args={[0.007, 0.007, 0.28, 8]} />
            <meshStandardMaterial color="#F1F5F9" metalness={0.92} roughness={0.15} />
          </mesh>

          {/* 5. Modern Floating Porch Canopy */}
          <mesh position={[-0.42, 0.12, 0.92]} castShadow>
            <boxGeometry args={[0.58, 0.04, 0.36]} />
            <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.4} />
          </mesh>
          {/* Entrance Warm Luminaire Sconce */}
          <mesh position={[-0.15, 0.1, 0.768]}>
            <cylinderGeometry args={[0.02, 0.02, 0.05, 8]} />
            <meshStandardMaterial color="#FEF08A" emissive="#F59E0B" emissiveIntensity={0.6} roughness={0.2} />
          </mesh>

          {/* 6. Front Picture Window with Midnight Mullion Frame & Reflective Glass */}
          <group position={[0.35, -0.12, 0.755]}>
            <mesh>
              <boxGeometry args={[0.58, 0.58, 0.025]} />
              <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.008]}>
              <boxGeometry args={[0.52, 0.52, 0.015]} />
              <meshStandardMaterial
                color="#38BDF8"
                emissive="#0284C7"
                emissiveIntensity={0.2}
                roughness={0.12}
                transparent
                opacity={0.78}
              />
            </mesh>
            <mesh position={[0, 0, 0.016]}>
              <boxGeometry args={[0.52, 0.018, 0.008]} />
              <meshStandardMaterial color="#0F172A" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.016]}>
              <boxGeometry args={[0.018, 0.52, 0.008]} />
              <meshStandardMaterial color="#0F172A" roughness={0.4} />
            </mesh>
          </group>

          {/* 7. Contemporary Standing-Seam Gable Roof */}
          <mesh position={[-0.4, 0.44, 0]} rotation={[0, 0, 0.4]} castShadow receiveShadow>
            <boxGeometry args={[0.94, 0.05, 1.66]} />
            <meshStandardMaterial color="#1E293B" roughness={0.35} metalness={0.45} />
          </mesh>
          <mesh position={[0.4, 0.44, 0]} rotation={[0, 0, -0.4]} castShadow receiveShadow>
            <boxGeometry args={[0.94, 0.05, 1.66]} />
            <meshStandardMaterial color="#1E293B" roughness={0.35} metalness={0.45} />
          </mesh>
          {/* Charcoal Ridge Cap at Roof Peak */}
          <mesh position={[0, 0.62, 0]} castShadow>
            <boxGeometry args={[0.08, 0.04, 1.68]} />
            <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Front & Rear Triangular Gable Wall Infill */}
          <mesh position={[0, 0.38, 0.74]}>
            <boxGeometry args={[1.36, 0.22, 0.02]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.38} />
          </mesh>
          <mesh position={[0, 0.38, -0.74]}>
            <boxGeometry args={[1.36, 0.22, 0.02]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.38} />
          </mesh>

          {/* 8. Side Outdoor Electrical Service Entrance */}
          <group position={[-0.76, 0.0, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.08, 0.36, 0.26]} />
              <meshStandardMaterial color="#64748B" metalness={0.82} roughness={0.25} />
            </mesh>
            <mesh position={[-0.045, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
              <meshStandardMaterial color="#BAE6FD" transparent opacity={0.65} roughness={0.12} />
            </mesh>
            <mesh position={[0, 0.32, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.32, 12]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.88} roughness={0.2} />
            </mesh>
          </group>

          {/* 9. Front Walkway Paver Step */}
          <mesh position={[-0.42, -0.77, 1.02]}>
            <boxGeometry args={[0.48, 0.04, 0.34]} />
            <meshStandardMaterial color="#CBD5E1" roughness={0.88} />
          </mesh>
        </group>
      );

    default:
      return (
        <group>
          <RoundedBox args={[0.78, 0.98, 0.44]} radius={0.03} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color="#F8FAFC" roughness={0.3} metalness={0.12} />
          </RoundedBox>
          <mesh position={[0, 0.1, 0.22]}>
            <boxGeometry args={[0.2, 0.28, 0.12]} />
            <meshStandardMaterial color={color} roughness={0.3} />
          </mesh>
        </group>
      );
  }
}
