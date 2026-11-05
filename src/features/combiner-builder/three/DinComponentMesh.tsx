// src/features/combiner-builder/three/DinComponentMesh.tsx
import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { CombinerComponentInstance } from '../types';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';
import { TerminalPortNode } from './TerminalPortNode';

interface DinComponentMeshProps {
  component: CombinerComponentInstance;
}

export function DinComponentMesh({ component }: DinComponentMeshProps) {
  const [isHovered, setIsHovered] = useState(false);
  const toggleLeverRef = useRef<THREE.Group>(null);
  const atsDialRef = useRef<THREE.Group>(null);

  const selectedComponentId = useCombinerBoxStore((s) => s.selectedComponentId);
  const setSelectedComponent = useCombinerBoxStore((s) => s.setSelectedComponent);
  const toggleBreakerSwitch = useCombinerBoxStore((s) => s.toggleBreakerSwitch);
  const atsSourceState = useCombinerBoxStore((s) => s.atsSourceState);
  const canvasTool = useCombinerBoxStore((s) => s.canvasTool);

  const isSelected = selectedComponentId === component.id;

  // Animate toggle lever switch angle (Up for ON, Down for OFF)
  useFrame((_, delta) => {
    if (toggleLeverRef.current) {
      const targetRotation = component.isSwitchOn ? 0.35 : -0.35;
      toggleLeverRef.current.rotation.x = THREE.MathUtils.damp(
        toggleLeverRef.current.rotation.x,
        targetRotation,
        14,
        delta,
      );
    }

    if (atsDialRef.current && (component.category === 'ats_cb' || component.category === 'ats_solenoid')) {
      const targetAngle =
        atsSourceState === 'source_a' ? 0 : atsSourceState === 'off' ? Math.PI / 4 : Math.PI / 2;
      atsDialRef.current.rotation.z = THREE.MathUtils.damp(
        atsDialRef.current.rotation.z,
        targetAngle,
        12,
        delta,
      );
    }
  });

  const handleComponentClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (canvasTool === 'move') {
      setSelectedComponent(component.id);
    }
  };

  const handleToggleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    toggleBreakerSwitch(component.id);
  };

  // Dimensional parameters based on width
  const bodyWidth = (component.widthMm / 1000) * 4.2; // Scaled to Three.js units
  const bodyHeight =
    component.mountZone === 'bottom_plate'
      ? 1.15
      : component.mountZone === 'side_busbar'
      ? 0.8
      : 0.86;
  const bodyDepth = component.mountZone === 'bottom_plate' ? 0.18 : 0.14;

  const isATS = component.category === 'ats_cb' || component.category === 'ats_solenoid';
  const isSPD = component.category === 'dc_spd' || component.category === 'ac_spd';
  const isMCCB = component.category === 'battery_mccb';
  const isBusbar = component.category === 'pe_busbar';

  // Toggle switch lever color
  const leverColor =
    component.category === 'dc_mcb'
      ? '#ef4444' // Red lever for DC
      : component.brand === 'ABB'
      ? '#1e293b' // Black lever for ABB
      : component.brand === 'MTC'
      ? '#16a34a' // Green lever for MTC RCBO
      : '#2563eb'; // Blue lever for standard AC MCB

  return (
    <group
      position={component.position3D}
      onClick={handleComponentClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setIsHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setIsHovered(false);
      }}
    >
      {/* Selection / Hover Glow Frame */}
      {(isSelected || isHovered) && !isBusbar && (
        <mesh position={[0, 0, bodyDepth / 2 + 0.005]}>
          <planeGeometry args={[bodyWidth + 0.04, bodyHeight + 0.04]} />
          <meshBasicMaterial
            color={isSelected ? '#f59e0b' : '#38bdf8'}
            wireframe
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* --- Case 1: Ground Busbar --- */}
      {isBusbar ? (
        <group>
          {/* Brass Bar Solid */}
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.07, 0.72, 0.02]} />
            <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.25} />
          </mesh>
          {/* Standoff Mounting Feet */}
          <mesh position={[0, 0.35, 0.02]}>
            <boxGeometry args={[0.1, 0.06, 0.03]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.35, 0.02]}>
            <boxGeometry args={[0.1, 0.06, 0.03]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
          </mesh>
        </group>
      ) : (
        /* --- Case 2: Standard DIN / MCCB Enclosure Casing --- */
        <group>
          {/* Main Modular Body (Industrial Off-White / Grey Polycarbonate) */}
          <mesh position={[0, 0, bodyDepth / 2]}>
            <boxGeometry args={[bodyWidth, bodyHeight, bodyDepth]} />
            <meshStandardMaterial
              color={
                isMCCB
                  ? '#1e293b'
                  : component.category === 'ats_solenoid'
                  ? '#0f172a'
                  : '#f1f5f9'
              }
              metalness={0.15}
              roughness={0.45}
            />
          </mesh>

          {/* Stepped Front Bezel / DIN Escutcheon Face */}
          <mesh position={[0, 0, bodyDepth + 0.015]}>
            <boxGeometry args={[bodyWidth * 0.94, bodyHeight * 0.52, 0.03]} />
            <meshStandardMaterial
              color={
                isMCCB
                  ? '#0f172a'
                  : component.category === 'ats_solenoid'
                  ? '#1e293b'
                  : '#e2e8f0'
              }
              metalness={0.2}
              roughness={0.35}
            />
          </mesh>

          {/* Breaker / Switch Name & Specs Label Plate */}
          <Text
            position={[0, 0.18, bodyDepth + 0.035]}
            fontSize={0.034}
            color={isMCCB || component.category === 'ats_solenoid' ? '#f8fafc' : '#0f172a'}
            maxWidth={bodyWidth * 0.88}
            anchorX="center"
            anchorY="middle"
          >
            {component.brand}
          </Text>
          <Text
            position={[0, 0.12, bodyDepth + 0.035]}
            fontSize={0.028}
            color={
              component.category === 'dc_mcb'
                ? '#ef4444'
                : isMCCB
                ? '#f59e0b'
                : isSPD
                ? '#10b981'
                : '#3b82f6'
            }
            maxWidth={bodyWidth * 0.9}
            anchorX="center"
            anchorY="middle"
          >
            {component.ratedVoltage}
          </Text>
          {component.ratedAmps > 0 && (
            <Text
              position={[0, 0.06, bodyDepth + 0.035]}
              fontSize={0.032}
              color={isMCCB ? '#f8fafc' : '#020617'}
              anchorX="center"
              anchorY="middle"
            >
              {`C${component.ratedAmps}`}
            </Text>
          )}

          {/* --- Interactive Toggle Lever (Click to Flip Breaker) --- */}
          {!isSPD && !isATS && component.category !== 'terminal_block' && component.category !== 'din_meter' && (
            <group
              ref={toggleLeverRef}
              position={[0, -0.06, bodyDepth + 0.03]}
              onClick={handleToggleClick}
            >
              {/* Lever Handle Pivot */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.025, 0.025, bodyWidth * 0.65, 16]} />
                <meshStandardMaterial color="#020617" roughness={0.3} />
              </mesh>
              {/* Toggle Handle Grip */}
              <mesh position={[0, 0.04, 0.03]}>
                <boxGeometry args={[bodyWidth * 0.6, 0.08, 0.05]} />
                <meshStandardMaterial
                  color={leverColor}
                  roughness={0.25}
                  metalness={0.2}
                />
              </mesh>
              {/* ON/OFF status text */}
              <Text
                position={[0, 0.04, 0.06]}
                fontSize={0.025}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {component.isSwitchOn ? 'ON' : 'OFF'}
              </Text>
            </group>
          )}

          {/* --- RCBO Test Button --- */}
          {component.category === 'ac_rcbo' && (
            <group position={[bodyWidth * 0.32, -0.06, bodyDepth + 0.035]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.015, 16]} />
                <meshStandardMaterial color="#eab308" roughness={0.3} />
              </mesh>
              <Text position={[0, 0, 0.012]} fontSize={0.022} color="#000000" anchorX="center" anchorY="middle">
                T
              </Text>
            </group>
          )}

          {/* --- Surge Protector (SPD) Replaceable Cartridges --- */}
          {isSPD && (
            <group position={[0, -0.06, bodyDepth + 0.025]}>
              {/* Twin cartridge plug-in blocks */}
              {[-0.045, 0.045].map((xOffset, idx) => (
                <group key={idx} position={[xOffset, 0, 0]}>
                  <mesh>
                    <boxGeometry args={[bodyWidth * 0.42, 0.22, 0.04]} />
                    <meshStandardMaterial
                      color={component.name.includes('Yellow') ? '#eab308' : '#cbd5e1'}
                      roughness={0.3}
                    />
                  </mesh>
                  {/* Status Indicator Window (Green = Healthy, Red = Blown) */}
                  <mesh position={[0, 0.04, 0.023]}>
                    <planeGeometry args={[0.035, 0.025]} />
                    <meshBasicMaterial color="#22c55e" />
                  </mesh>
                  <Text position={[0, -0.04, 0.024]} fontSize={0.02} color="#0f172a" anchorX="center" anchorY="middle">
                    {component.category === 'dc_spd' ? '1000V' : '385V'}
                  </Text>
                </group>
              ))}
            </group>
          )}

          {/* --- Dual-Power ATS Features (Rotary Knob, Slide Switch & LEDs) --- */}
          {isATS && (
            <group position={[0, -0.06, bodyDepth + 0.035]}>
              {/* ATS Central Rotary Selector Dial */}
              <group ref={atsDialRef} position={[0, 0, 0.01]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.07, 0.07, 0.04, 24]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
                </mesh>
                {/* Pointer indicator notch */}
                <mesh position={[0, 0.05, 0.025]}>
                  <boxGeometry args={[0.012, 0.035, 0.015]} />
                  <meshStandardMaterial color="#ef4444" />
                </mesh>
              </group>

              {/* Source A Status LED (UN) */}
              <group position={[-bodyWidth * 0.32, 0.04, 0.01]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.018, 0.018, 0.01, 16]} />
                  <meshBasicMaterial
                    color={atsSourceState === 'source_a' ? '#22c55e' : '#14532d'}
                  />
                </mesh>
                <Text position={[0, -0.03, 0]} fontSize={0.022} color="#ffffff" anchorX="center" anchorY="middle">
                  UN
                </Text>
              </group>

              {/* Source B Status LED (UR) */}
              <group position={[bodyWidth * 0.32, 0.04, 0.01]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.018, 0.018, 0.01, 16]} />
                  <meshBasicMaterial
                    color={atsSourceState === 'source_b' ? '#f59e0b' : '#78350f'}
                  />
                </mesh>
                <Text position={[0, -0.03, 0]} fontSize={0.022} color="#ffffff" anchorX="center" anchorY="middle">
                  UR
                </Text>
              </group>

              {/* Solenoid Green 6-Pin Plug Header */}
              {component.category === 'ats_solenoid' && (
                <group position={[0, -0.22, 0.05]}>
                  <mesh>
                    <boxGeometry args={[bodyWidth * 0.5, 0.06, 0.04]} />
                    <meshStandardMaterial color="#15803d" roughness={0.3} />
                  </mesh>
                  <Text position={[0, 0, 0.022]} fontSize={0.022} color="#ffffff" anchorX="center" anchorY="middle">
                    SENSE & CONTROL
                  </Text>
                </group>
              )}
            </group>
          )}

          {/* --- Smart Digital LCD VA/kWh Meter Display --- */}
          {component.category === 'din_meter' && (
            <group position={[0, -0.04, bodyDepth + 0.03]}>
              {/* Blue outer bezel */}
              <mesh>
                <boxGeometry args={[bodyWidth * 0.88, 0.28, 0.02]} />
                <meshStandardMaterial color="#0284c7" roughness={0.3} />
              </mesh>
              {/* Backlit LCD Screen */}
              <mesh position={[0, 0, 0.012]}>
                <planeGeometry args={[bodyWidth * 0.8, 0.24]} />
                <meshBasicMaterial color="#0c4a6e" />
              </mesh>
              <Text position={[0, 0.06, 0.02]} fontSize={0.028} color="#38bdf8" anchorX="center" anchorY="middle">
                231.4 V
              </Text>
              <Text position={[0, 0.0, 0.02]} fontSize={0.028} color="#4ade80" anchorX="center" anchorY="middle">
                18.6 A
              </Text>
              <Text position={[0, -0.06, 0.02]} fontSize={0.024} color="#facc15" anchorX="center" anchorY="middle">
                4.30 kW
              </Text>
            </group>
          )}
        </group>
      )}

      {/* --- Terminal Ports --- */}
      {component.ports.map((port) => (
        <TerminalPortNode
          key={port.id}
          port={port}
          componentWorldPos={component.position3D}
        />
      ))}
    </group>
  );
}
