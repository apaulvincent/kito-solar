// src/features/combiner-builder/three/DinComponentMesh.tsx
import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import { Trash2 } from 'lucide-react';
import * as THREE from 'three';
import { useCalculatorStore } from '@/store/useCalculatorStore';
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
  const isolatorKnobRef = useRef<THREE.Group>(null);

  const theme = useCalculatorStore((s) => s.theme);
  const isDark = theme === 'dark';

  const selectedComponentId = useCombinerBoxStore((s) => s.selectedComponentId);
  const setSelectedComponent = useCombinerBoxStore((s) => s.setSelectedComponent);
  const removeComponent = useCombinerBoxStore((s) => s.removeComponent);
  const toggleBreakerSwitch = useCombinerBoxStore((s) => s.toggleBreakerSwitch);
  const atsSourceState = useCombinerBoxStore((s) => s.atsSourceState);
  const setAtsSourceState = useCombinerBoxStore((s) => s.setAtsSourceState);
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

    if (isolatorKnobRef.current) {
      const targetRotation = component.isSwitchOn ? 0.35 : -Math.PI / 2;
      isolatorKnobRef.current.rotation.z = THREE.MathUtils.damp(
        isolatorKnobRef.current.rotation.z,
        targetRotation,
        12,
        delta,
      );
    }

    if (atsDialRef.current && (component.category === 'ats_cb' || component.category === 'ats_solenoid')) {
      const targetAngle =
        atsSourceState === 'source_a' ? 0.45 : atsSourceState === 'off' ? 0 : -0.55;
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
    if (canvasTool === 'cut') {
      removeComponent(component.id);
    } else {
      setSelectedComponent(component.id);
    }
  };

  const handleToggleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (isATS) {
      setAtsSourceState(
        atsSourceState === 'source_a'
          ? 'source_b'
          : atsSourceState === 'source_b'
          ? 'off'
          : 'source_a',
      );
      return;
    }
    toggleBreakerSwitch(component.id);
  };

  const isATS = component.category === 'ats_cb' || component.category === 'ats_solenoid';
  const isSPD = component.category === 'dc_spd' || component.category === 'ac_spd';
  const isMCCB = component.category === 'battery_mccb';
  const isBusbar = component.category === 'pe_busbar';
  const isDcIsolator = component.category === 'dc_isolator';
  const isAcIsolator = component.category === 'ac_isolator';
  const isProtector = component.category === 'digital_protector';
  const isMeter = component.category === 'din_meter';
  const isNonpolarDC =
    component.category === 'dc_mcb' &&
    (component.name.includes('Non-Polarity') || component.catalogId.includes('nonpolar'));
  const isChnt = component.brand === 'CHNT';

  // Dimensional parameters based on physical mm width
  const bodyWidth = (component.widthMm / 1000) * 4.2;
  const bodyHeight = isMCCB ? 0.65 : isBusbar ? 0.60 : 0.52;
  const bodyDepth = isMCCB ? 0.16 : 0.12;

  // Match component casing colors to the reference diagram hardware while maintaining contrast
  const isDarkBody = isMCCB || isATS || component.category === 'dc_spd' || isNonpolarDC;

  const bodyColor = isMCCB
    ? '#1e293b'
    : isATS
    ? '#191d24'
    : component.category === 'dc_spd'
    ? '#2b343b'
    : isNonpolarDC
    ? '#2d3748'
    : isDcIsolator
    ? '#e2e8f0'
    : '#f8fafc';

  const bezelColor = isMCCB
    ? '#0f172a'
    : isATS
    ? '#232831'
    : component.category === 'dc_spd'
    ? '#374151'
    : isNonpolarDC
    ? '#374151'
    : isDcIsolator
    ? '#334155'
    : '#e2e8f0';

  const outerRimColor = isDarkBody
    ? isDark
      ? '#64748b'
      : '#475569'
    : isDark
    ? '#94a3b8'
    : '#64748b';

  // Toggle switch lever color
  const leverColor = isAcIsolator
    ? '#16a34a'
    : isNonpolarDC
    ? '#22c55e'
    : component.category === 'dc_mcb'
    ? '#ef4444'
    : component.brand === 'ABB'
    ? '#1e293b'
    : component.brand === 'MTC'
    ? '#16a34a'
    : '#2563eb';

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
      {/* Selection / Hover Highlight Frame */}
      {(isSelected || isHovered) && (
        <mesh position={[0, 0, bodyDepth / 2 + 0.008]}>
          <planeGeometry args={[bodyWidth + 0.032, bodyHeight + 0.032]} />
          <meshBasicMaterial
            color={
              canvasTool === 'cut' && isHovered
                ? '#ef4444'
                : isSelected
                ? '#f59e0b'
                : '#38bdf8'
            }
            wireframe
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {/* Floating 3D Delete Action Badge when component is selected */}
      {isSelected && (
        <Html
          position={[0, bodyHeight / 2 + 0.09, bodyDepth / 2 + 0.04]}
          center
          distanceFactor={5.5}
        >
          <div className="flex items-center gap-1 bg-slate-950/95 border border-rose-500/60 rounded-md p-0.5 shadow-2xl backdrop-blur-md select-none pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeComponent(component.id);
              }}
              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              title={`Delete ${component.name}`}
            >
              <Trash2 className="w-3 h-3 text-white" />
              <span>Delete</span>
            </button>
          </div>
        </Html>
      )}

      {/* --- Case 1: Brass Ground Busbar --- */}
      {isBusbar ? (
        <group>
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.065, 0.56, 0.018]} />
            <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.26, 0.015]}>
            <boxGeometry args={[0.09, 0.05, 0.025]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.26, 0.015]}>
            <boxGeometry args={[0.09, 0.05, 0.025]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
          </mesh>
        </group>
      ) : (
        /* --- Case 2: Standard DIN / ATS / MCCB Housing --- */
        <group>
          {/* High-Contrast Edge Silhouette Outline for Both Dark and Light Backplates */}
          <mesh position={[0, 0, bodyDepth * 0.45]}>
            <boxGeometry args={[bodyWidth + 0.014, bodyHeight + 0.014, bodyDepth * 0.92]} />
            <meshStandardMaterial color={outerRimColor} metalness={0.35} roughness={0.35} />
          </mesh>

          {/* Main Modular Body */}
          <mesh position={[0, 0, bodyDepth / 2]}>
            <boxGeometry args={[bodyWidth, bodyHeight, bodyDepth]} />
            <meshStandardMaterial
              color={bodyColor}
              metalness={0.15}
              roughness={0.45}
            />
          </mesh>

          {/* Stepped Front Bezel / DIN Escutcheon Face */}
          <mesh position={[0, 0, bodyDepth + 0.012]}>
            <boxGeometry
              args={[
                isATS ? bodyWidth * 1.02 : bodyWidth * 0.94,
                isDcIsolator ? bodyHeight * 0.62 : isATS ? bodyHeight * 0.50 : bodyHeight * 0.56,
                0.024,
              ]}
            />
            <meshStandardMaterial
              color={bezelColor}
              metalness={0.2}
              roughness={0.35}
            />
          </mesh>

          {/* CHNT Iconic Blue Brand Header Stripe (AC MCBs 80A/63A/40A/30A) */}
          {isChnt && (
            <mesh position={[-bodyWidth * 0.14, bodyHeight * 0.21, bodyDepth + 0.025]}>
              <boxGeometry args={[bodyWidth * 0.54, 0.036, 0.004]} />
              <meshStandardMaterial color="#2563eb" roughness={0.3} />
            </mesh>
          )}

          {/* Watt Meter Blue Brand Bar */}
          {isMeter && (
            <mesh position={[0, bodyHeight * 0.23, bodyDepth + 0.025]}>
              <boxGeometry args={[bodyWidth * 0.88, 0.032, 0.004]} />
              <meshStandardMaterial color="#1d4ed8" roughness={0.3} />
            </mesh>
          )}

          {/* Non-Polarity DC MCB Green Brand Stripe */}
          {isNonpolarDC && (
            <mesh position={[bodyWidth * 0.14, bodyHeight * 0.21, bodyDepth + 0.025]}>
              <boxGeometry args={[bodyWidth * 0.52, 0.034, 0.004]} />
              <meshStandardMaterial color="#16a34a" roughness={0.3} />
            </mesh>
          )}

          {/* AC Isolator Green Brand Accent */}
          {isAcIsolator && (
            <mesh position={[0, bodyHeight * 0.21, bodyDepth + 0.025]}>
              <boxGeometry args={[bodyWidth * 0.72, 0.03, 0.004]} />
              <meshStandardMaterial color="#16a34a" roughness={0.3} />
            </mesh>
          )}

          {/* 2-Pole Center Division Seam */}
          {component.widthMm === 36 && !isProtector && (
            <mesh position={[0, 0, bodyDepth + 0.025]}>
              <boxGeometry args={[0.003, bodyHeight * 0.54, 0.002]} />
              <meshStandardMaterial color={isDarkBody ? '#475569' : '#cbd5e1'} roughness={0.6} />
            </mesh>
          )}

          {/* --- 100A Dual-Power ATS Detailed Reference Replica --- */}
          {isATS && (
            <group>
              {/* Top-left & Bottom-left Metallic Screw Clamp Terminal Channels (R / N bays) */}
              {[-0.17, -0.09].map((xPos, idx) => (
                <group key={`ats_term_top_${idx}`} position={[xPos, bodyHeight * 0.37, bodyDepth + 0.015]}>
                  <mesh>
                    <boxGeometry args={[0.044, 0.11, 0.022]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.25} />
                  </mesh>
                  <mesh position={[0, 0, 0.012]}>
                    <boxGeometry args={[0.03, 0.08, 0.006]} />
                    <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
                  </mesh>
                </group>
              ))}
              {[-0.05, 0.05].map((xPos, idx) => (
                <group key={`ats_term_bot_${idx}`} position={[xPos, -bodyHeight * 0.37, bodyDepth + 0.015]}>
                  <mesh>
                    <boxGeometry args={[0.044, 0.11, 0.022]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.25} />
                  </mesh>
                  <mesh position={[0, 0, 0.012]}>
                    <boxGeometry args={[0.03, 0.08, 0.006]} />
                    <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
                  </mesh>
                </group>
              ))}

              {/* Iconic Bright Green 6-Pin Sensing Terminal Plug Headers (Top-Right & Bottom-Right) */}
              <group position={[bodyWidth * 0.27, bodyHeight * 0.48, bodyDepth * 0.55]}>
                <mesh>
                  <boxGeometry args={[bodyWidth * 0.36, 0.042, 0.05]} />
                  <meshStandardMaterial color="#16a34a" roughness={0.3} />
                </mesh>
                {[-0.055, -0.028, 0, 0.028, 0.055].map((px, pi) => (
                  <mesh key={pi} position={[px, 0.01, 0.026]}>
                    <cylinderGeometry args={[0.006, 0.006, 0.005, 8]} />
                    <meshBasicMaterial color="#0f172a" />
                  </mesh>
                ))}
              </group>
              <group position={[bodyWidth * 0.27, -bodyHeight * 0.48, bodyDepth * 0.55]}>
                <mesh>
                  <boxGeometry args={[bodyWidth * 0.36, 0.042, 0.05]} />
                  <meshStandardMaterial color="#16a34a" roughness={0.3} />
                </mesh>
                {[-0.055, -0.028, 0, 0.028, 0.055].map((px, pi) => (
                  <mesh key={pi} position={[px, -0.01, 0.026]}>
                    <cylinderGeometry args={[0.006, 0.006, 0.005, 8]} />
                    <meshBasicMaterial color="#0f172a" />
                  </mesh>
                ))}
              </group>

              {/* Source A (PV Inverter) & Source B (Grid Power) Upper/Lower Markings */}
              <Text
                position={[bodyWidth * 0.08, bodyHeight * 0.36, bodyDepth + 0.014]}
                fontSize={0.017}
                color="#e2e8f0"
                anchorX="center"
                anchorY="middle"
              >
                Source A: PV/Inv
              </Text>
              <Text
                position={[bodyWidth * 0.24, -bodyHeight * 0.36, bodyDepth + 0.014]}
                fontSize={0.017}
                color="#e2e8f0"
                anchorX="center"
                anchorY="middle"
              >
                Source B: Grid
              </Text>
            </group>
          )}

          {/* Persistent Terminal Silkscreen Markings */}
          {isATS ? (
            <group position={[0, bodyHeight * 0.44, bodyDepth + 0.026]}>
              <Text position={[-bodyWidth * 0.36, 0, 0]} fontSize={0.018} color="#f8fafc" anchorX="center" anchorY="middle">
                AL
              </Text>
              <Text position={[-bodyWidth * 0.14, 0, 0]} fontSize={0.018} color="#38bdf8" anchorX="center" anchorY="middle">
                AN
              </Text>
              <Text position={[bodyWidth * 0.14, 0, 0]} fontSize={0.018} color="#f8fafc" anchorX="center" anchorY="middle">
                BL
              </Text>
              <Text position={[bodyWidth * 0.36, 0, 0]} fontSize={0.018} color="#38bdf8" anchorX="center" anchorY="middle">
                BN
              </Text>
            </group>
          ) : component.category === 'dc_mcb' || isDcIsolator ? (
            <group position={[0, bodyHeight * 0.44, bodyDepth + 0.02]}>
              <Text position={[-bodyWidth * 0.24, 0, 0]} fontSize={0.021} color="#ef4444" anchorX="center" anchorY="middle">
                + IN
              </Text>
              <Text position={[bodyWidth * 0.24, 0, 0]} fontSize={0.021} color={isDarkBody ? '#cbd5e1' : '#334155'} anchorX="center" anchorY="middle">
                - IN
              </Text>
            </group>
          ) : component.category === 'dc_spd' ? (
            <group position={[0, bodyHeight * 0.44, bodyDepth + 0.02]}>
              <Text position={[-bodyWidth * 0.24, 0, 0]} fontSize={0.02} color="#ef4444" anchorX="center" anchorY="middle">
                DC+
              </Text>
              <Text position={[bodyWidth * 0.24, 0, 0]} fontSize={0.02} color="#cbd5e1" anchorX="center" anchorY="middle">
                DC-
              </Text>
            </group>
          ) : component.category === 'ac_spd' ? (
            <group position={[0, bodyHeight * 0.44, bodyDepth + 0.02]}>
              <Text position={[-bodyWidth * 0.24, 0, 0]} fontSize={0.02} color="#ef4444" anchorX="center" anchorY="middle">
                L
              </Text>
              <Text position={[bodyWidth * 0.24, 0, 0]} fontSize={0.02} color="#3b82f6" anchorX="center" anchorY="middle">
                N
              </Text>
            </group>
          ) : component.widthMm === 36 ? (
            <group position={[0, bodyHeight * 0.44, bodyDepth + 0.02]}>
              <Text position={[-bodyWidth * 0.24, 0, 0]} fontSize={0.018} color={isDarkBody ? '#f8fafc' : '#0f172a'} anchorX="center" anchorY="middle">
                L IN
              </Text>
              <Text position={[bodyWidth * 0.24, 0, 0]} fontSize={0.018} color={isDarkBody ? '#93c5fd' : '#1d4ed8'} anchorX="center" anchorY="middle">
                N IN
              </Text>
            </group>
          ) : null}

          {/* Bottom terminal silkscreen markings */}
          {isATS ? (
            <group position={[0, -bodyHeight * 0.44, bodyDepth + 0.026]}>
              <Text position={[-0.05, 0, 0]} fontSize={0.017} color="#f8fafc" anchorX="center" anchorY="middle">
                LOAD L
              </Text>
              <Text position={[0.05, 0, 0]} fontSize={0.017} color="#38bdf8" anchorX="center" anchorY="middle">
                LOAD N
              </Text>
            </group>
          ) : isSPD ? (
            <group position={[0, -bodyHeight * 0.44, bodyDepth + 0.02]}>
              <Text position={[0, 0, 0]} fontSize={0.02} color="#22c55e" anchorX="center" anchorY="middle">
                PE GND
              </Text>
            </group>
          ) : component.category === 'dc_mcb' || isDcIsolator ? (
            <group position={[0, -bodyHeight * 0.44, bodyDepth + 0.02]}>
              <Text position={[-bodyWidth * 0.24, 0, 0]} fontSize={0.019} color="#ef4444" anchorX="center" anchorY="middle">
                + OUT
              </Text>
              <Text position={[bodyWidth * 0.24, 0, 0]} fontSize={0.019} color={isDarkBody ? '#cbd5e1' : '#334155'} anchorX="center" anchorY="middle">
                - OUT
              </Text>
            </group>
          ) : component.widthMm === 36 ? (
            <group position={[0, -bodyHeight * 0.44, bodyDepth + 0.02]}>
              <Text position={[-bodyWidth * 0.24, 0, 0]} fontSize={0.018} color={isDarkBody ? '#f8fafc' : '#0f172a'} anchorX="center" anchorY="middle">
                L OUT
              </Text>
              <Text position={[bodyWidth * 0.24, 0, 0]} fontSize={0.018} color={isDarkBody ? '#93c5fd' : '#1d4ed8'} anchorX="center" anchorY="middle">
                N OUT
              </Text>
            </group>
          ) : null}

          {/* Standard Faceplate Labels (skipped for ATS, Protector & DC Isolator which have custom front plates) */}
          {!isATS && !isProtector && !isDcIsolator && (
            <>
              <Text
                position={[0, isChnt ? 0.075 : 0.09, bodyDepth + 0.028]}
                fontSize={isChnt ? 0.024 : 0.027}
                color={isDarkBody ? '#f8fafc' : '#0f172a'}
                maxWidth={bodyWidth * 0.88}
                anchorX="center"
                anchorY="middle"
              >
                {component.brand}
              </Text>
              <Text
                position={[0, 0.04, bodyDepth + 0.028]}
                fontSize={0.02}
                color={
                  component.category === 'dc_mcb'
                    ? '#4ade80'
                    : isMCCB
                    ? '#f59e0b'
                    : isSPD
                    ? '#10b981'
                    : isAcIsolator
                    ? '#16a34a'
                    : '#0284c7'
                }
                maxWidth={bodyWidth * 0.9}
                anchorX="center"
                anchorY="middle"
              >
                {component.ratedVoltage}
              </Text>
              {component.ratedAmps > 0 && !isMeter && (
                <Text
                  position={[0, 0.0, bodyDepth + 0.028]}
                  fontSize={0.024}
                  color={isDarkBody ? '#f8fafc' : '#020617'}
                  anchorX="center"
                  anchorY="middle"
                >
                  {isAcIsolator ? `${component.ratedAmps}A` : `C${component.ratedAmps}`}
                </Text>
              )}
            </>
          )}

          {/* --- Interactive Toggle Lever (MCBs, RCBO, AC Isolator) --- */}
          {!isSPD && !isATS && !isDcIsolator && !isProtector && !isMeter && component.category !== 'terminal_block' && (
            <group
              ref={toggleLeverRef}
              position={[0, -0.068, bodyDepth + 0.026]}
              onClick={handleToggleClick}
            >
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.02, 0.02, bodyWidth * 0.68, 16]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.03, 0.024]}>
                <boxGeometry args={[bodyWidth * 0.62, 0.06, 0.04]} />
                <meshStandardMaterial
                  color={leverColor}
                  roughness={0.25}
                  metalness={0.2}
                />
              </mesh>
              <Text
                position={[0, 0.03, 0.048]}
                fontSize={0.019}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {component.isSwitchOn ? 'ON' : 'OFF'}
              </Text>
            </group>
          )}

          {/* --- DC Rotary Isolator (Matches Reference: Light Housing + Dark Center Block + Black Handle w/ Red Tip) --- */}
          {isDcIsolator && (
            <group position={[0, 0, bodyDepth + 0.026]} onClick={handleToggleClick}>
              <Text
                position={[-bodyWidth * 0.25, 0.125, 0.002]}
                fontSize={0.017}
                color="#cbd5e1"
                anchorX="center"
                anchorY="middle"
              >
                1000V DC
              </Text>
              <Text
                position={[-bodyWidth * 0.27, -0.115, 0.002]}
                fontSize={0.017}
                color="#f8fafc"
                anchorX="center"
                anchorY="middle"
              >
                LOCK
              </Text>

              {/* Black Circular Dial Base */}
              <mesh position={[0.01, -0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.068, 0.068, 0.014, 24]} />
                <meshStandardMaterial color="#090d16" roughness={0.4} />
              </mesh>

              {/* Black Rotary Switch Bar with Red Tip Cap */}
              <group ref={isolatorKnobRef} position={[0.01, -0.01, 0.015]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.026, 0.026, 0.022, 18]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.35} />
                </mesh>
                {/* Handle Bar */}
                <mesh position={[0, 0.014, 0.012]}>
                  <boxGeometry args={[0.022, 0.088, 0.022]} />
                  <meshStandardMaterial color="#111827" roughness={0.3} />
                </mesh>
                {/* Bright Red Pointer Tip matching Reference */}
                <mesh position={[0, 0.052, 0.012]}>
                  <boxGeometry args={[0.024, 0.022, 0.024]} />
                  <meshStandardMaterial color="#ef4444" roughness={0.2} />
                </mesh>
              </group>

              <Text position={[-0.058, -0.01, 0.01]} fontSize={0.018} color="#94a3b8" anchorX="center" anchorY="middle">
                OFF
              </Text>
              <Text position={[0.01, 0.075, 0.01]} fontSize={0.018} color="#f8fafc" anchorX="center" anchorY="middle">
                ON
              </Text>
            </group>
          )}

          {/* --- RCBO Test Button --- */}
          {component.category === 'ac_rcbo' && (
            <group position={[bodyWidth * 0.32, -0.065, bodyDepth + 0.028]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.012, 16]} />
                <meshStandardMaterial color="#eab308" roughness={0.3} />
              </mesh>
              <Text position={[0, 0, 0.01]} fontSize={0.018} color="#000000" anchorX="center" anchorY="middle">
                T
              </Text>
            </group>
          )}

          {/* --- Surge Protector (SPD) Dual Cartridges --- */}
          {isSPD && (
            <group position={[0, -0.05, bodyDepth + 0.022]}>
              {[-0.036, 0.036].map((xOffset, idx) => (
                <group key={idx} position={[xOffset, 0, 0]}>
                  <mesh>
                    <boxGeometry args={[bodyWidth * 0.42, 0.16, 0.028]} />
                    <meshStandardMaterial
                      color={
                        component.category === 'dc_spd'
                          ? '#1f513b'
                          : component.name.includes('Yellow')
                          ? '#eab308'
                          : '#e2e8f0'
                      }
                      roughness={0.3}
                    />
                  </mesh>
                  {/* Status Indicator Window (Green = Healthy) */}
                  <mesh position={[0, 0.03, 0.016]}>
                    <planeGeometry args={[0.026, 0.018]} />
                    <meshBasicMaterial color="#22c55e" />
                  </mesh>
                  <Text
                    position={[0, -0.03, 0.016]}
                    fontSize={0.014}
                    color={component.category === 'dc_spd' ? '#f8fafc' : '#0f172a'}
                    anchorX="center"
                    anchorY="middle"
                  >
                    {component.category === 'dc_spd' ? '1000V' : '385V'}
                  </Text>
                </group>
              ))}
            </group>
          )}

          {/* --- 100A Dual-Power ATS Front Panel (Green Pointed Dial + Spec Block + Auto/Manual Selector) --- */}
          {isATS && (
            <group position={[0, 0, bodyDepth + 0.026]} onClick={handleToggleClick}>
              {/* Left Source Marker Texts on Raised Band */}
              <Text position={[-bodyWidth * 0.34, 0.085, 0.004]} fontSize={0.015} color="#cbd5e1" anchorX="center" anchorY="middle">
                Source A
              </Text>
              <Text position={[-bodyWidth * 0.34, -0.085, 0.004]} fontSize={0.015} color="#cbd5e1" anchorX="center" anchorY="middle">
                Source B
              </Text>

              {/* Center-Left Circular Dial Housing & Green Rotary Knob */}
              <group position={[-0.06, 0, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.082, 0.082, 0.014, 28]} />
                  <meshStandardMaterial color="#090d16" metalness={0.5} roughness={0.35} />
                </mesh>
                <mesh position={[0, 0, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.072, 0.082, 28]} />
                  <meshStandardMaterial color="#475569" roughness={0.35} />
                </mesh>

                {/* Rotating Bright Green Asymmetric Handle Bar */}
                <group ref={atsDialRef} position={[0, 0, 0.016]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.026, 0.026, 0.018, 20]} />
                    <meshStandardMaterial color="#16a34a" roughness={0.25} />
                  </mesh>
                  {/* Tapered Green Selector Blade */}
                  <mesh position={[0, 0.01, 0.006]}>
                    <boxGeometry args={[0.022, 0.115, 0.022]} />
                    <meshStandardMaterial color="#22c55e" roughness={0.22} metalness={0.15} />
                  </mesh>
                  {/* White Pointer Accent */}
                  <mesh position={[0, 0.048, 0.019]}>
                    <boxGeometry args={[0.007, 0.02, 0.004]} />
                    <meshStandardMaterial color="#ffffff" />
                  </mesh>
                </group>
              </group>

              {/* Center Spec Nameplate Block */}
              <group position={[0.085, 0, 0.004]}>
                <Text position={[0, 0.065, 0]} fontSize={0.021} color="#f8fafc" anchorX="center" anchorY="middle">
                  TOQ5-100PV
                </Text>
                <Text position={[0, 0.028, 0]} fontSize={0.018} color="#38bdf8" anchorX="center" anchorY="middle">
                  100A • 230V AC
                </Text>
                <Text position={[0, -0.008, 0]} fontSize={0.014} color="#94a3b8" anchorX="center" anchorY="middle">
                  Dual Power ATS
                </Text>
                <Text position={[0, -0.044, 0]} fontSize={0.014} color={atsSourceState === 'source_a' ? '#4ade80' : '#f59e0b'} anchorX="center" anchorY="middle">
                  {atsSourceState === 'source_a' ? 'ACTIVE: SOURCE A' : atsSourceState === 'source_b' ? 'ACTIVE: SOURCE B' : 'OFF (ISOLATED)'}
                </Text>
              </group>

              {/* Right Edge Red Source LED + Vertical Green Auto/Manual Switch */}
              <group position={[bodyWidth * 0.39, 0, 0.006]}>
                <mesh position={[0, 0.068, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.014, 0.014, 0.008, 16]} />
                  <meshBasicMaterial color={atsSourceState === 'source_a' ? '#ef4444' : '#7f1d1d'} />
                </mesh>
                <Text position={[0, 0.038, 0]} fontSize={0.012} color="#e2e8f0" anchorX="center" anchorY="middle">
                  Manual
                </Text>
                <mesh position={[0, 0.0, 0.004]}>
                  <boxGeometry args={[0.026, 0.055, 0.014]} />
                  <meshStandardMaterial color="#16a34a" roughness={0.3} />
                </mesh>
                <Text position={[0, -0.044, 0]} fontSize={0.012} color="#4ade80" anchorX="center" anchorY="middle">
                  Auto
                </Text>
              </group>
            </group>
          )}

          {/* --- Digital Voltage & Current Protector (Tall Dual Red LED Display + ASCII Buttons) --- */}
          {isProtector && (
            <group position={[0, -0.01, bodyDepth + 0.025]}>
              <Text position={[0, 0.145, 0.002]} fontSize={0.019} color="#0f172a" anchorX="center" anchorY="middle">
                VA PROTECTOR
              </Text>
              <mesh>
                <boxGeometry args={[bodyWidth * 0.86, 0.25, 0.018]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.065, 0.01]}>
                <planeGeometry args={[bodyWidth * 0.78, 0.078]} />
                <meshBasicMaterial color="#09090b" />
              </mesh>
              <Text position={[0, 0.065, 0.014]} fontSize={0.028} color="#ef4444" anchorX="center" anchorY="middle">
                230 V
              </Text>
              <mesh position={[0, -0.025, 0.01]}>
                <planeGeometry args={[bodyWidth * 0.78, 0.078]} />
                <meshBasicMaterial color="#09090b" />
              </mesh>
              <Text position={[0, -0.025, 0.014]} fontSize={0.028} color="#ef4444" anchorX="center" anchorY="middle">
                {component.ratedAmps > 0 ? `${component.ratedAmps}.0 A` : '15.3 A'}
              </Text>
              <group position={[0, -0.092, 0.012]}>
                {[-0.034, 0, 0.034].map((x, i) => (
                  <group key={i} position={[x, 0, 0]}>
                    <mesh>
                      <boxGeometry args={[0.024, 0.018, 0.008]} />
                      <meshStandardMaterial color="#334155" roughness={0.4} />
                    </mesh>
                    <Text position={[0, 0, 0.006]} fontSize={0.011} color="#f8fafc" anchorX="center" anchorY="middle">
                      {i === 0 ? '+' : i === 1 ? '-' : 'SET'}
                    </Text>
                  </group>
                ))}
              </group>
            </group>
          )}

          {/* --- Digital Watt Meter with Multi-Tier Color LCD Display --- */}
          {isMeter && (
            <group position={[0, -0.025, bodyDepth + 0.025]}>
              <mesh>
                <boxGeometry args={[bodyWidth * 0.88, 0.24, 0.018]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[bodyWidth * 0.82, 0.21]} />
                <meshBasicMaterial color="#020617" />
              </mesh>
              <Text position={[0, 0.075, 0.015]} fontSize={0.024} color="#facc15" anchorX="center" anchorY="middle">
                1239.3 W
              </Text>
              <Text position={[0, 0.028, 0.015]} fontSize={0.022} color="#22d3ee" anchorX="center" anchorY="middle">
                15.36 A
              </Text>
              <Text position={[0, -0.018, 0.015]} fontSize={0.019} color="#f87171" anchorX="center" anchorY="middle">
                235.6 V  49.9 Hz
              </Text>
              <Text position={[0, -0.064, 0.015]} fontSize={0.021} color="#4ade80" anchorX="center" anchorY="middle">
                148.2 kWh
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
