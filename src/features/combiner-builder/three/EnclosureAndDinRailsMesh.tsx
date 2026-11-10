// src/features/combiner-builder/three/EnclosureAndDinRailsMesh.tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';

interface EnclosureAndDinRailsMeshProps {
  hasBatteryMccb?: boolean;
}

interface FeederCableProps {
  points: [number, number, number][];
  color: string;
  radius?: number;
  isEnergized: boolean;
}

function FeederCable({ points, color, radius = 0.009, isEnergized }: FeederCableProps) {
  const tubeGeo = useMemo(() => {
    const vectors = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const curve = new THREE.CatmullRomCurve3(vectors, false, 'centripetal', 0.2);
    return new THREE.TubeGeometry(curve, 24, radius, 8, false);
  }, [points, radius]);

  return (
    <mesh geometry={tubeGeo}>
      <meshStandardMaterial
        color={color}
        emissive={isEnergized ? color : '#000000'}
        emissiveIntensity={isEnergized ? 0.25 : 0}
        metalness={0.15}
        roughness={0.35}
      />
    </mesh>
  );
}

export function EnclosureAndDinRailsMesh({ hasBatteryMccb = false }: EnclosureAndDinRailsMeshProps) {
  const theme = useCalculatorStore((s) => s.theme);
  const isEnergized = useCombinerBoxStore((s) => s.isEnergized);
  const isDark = theme === 'dark';

  // Calibrated contrast tokens for both dark (#0b0f19) and light (#f8fafc) viewports
  const backplateColor = isDark ? '#475569' : '#cbd5e1'; // Galvanized zinc steel
  const wallColor = isDark ? '#334155' : '#64748b';
  const flangeColor = isDark ? '#94a3b8' : '#334155'; // Sharp chamfered outer rim
  const dinRailSpine = isDark ? '#cbd5e1' : '#94a3b8';
  const dinRailSlots = isDark ? '#1e293b' : '#475569';
  const bottomPlateColor = isDark ? '#2d3748' : '#94a3b8';
  const bottomPlateText = isDark ? '#fca5a5' : '#7f1d1d';
  const glandNutColor = isDark ? '#eab308' : '#ca8a04';

  const topKnockouts = [
    { id: 'grid', label: 'GRID IN • 230V AC', sub: 'Live Utility Mains', x: -1.06, color: '#38bdf8', dir: 'in' as const },
    { id: 'pv1', label: 'PV1 DC • 1000V', sub: 'String Input (+ / -)', x: -0.57, color: '#fb923c', dir: 'in' as const },
    { id: 'inv', label: 'INVERTER • 230V AC', sub: 'Live Solar Output', x: 0.25, color: '#facc15', dir: 'in' as const },
    { id: 'pv_out', label: 'PV TO INV • 1000V', sub: 'Protected DC Feed', x: 0.76, color: '#f59e0b', dir: 'out' as const },
  ];

  const bottomKnockouts = hasBatteryMccb
    ? [
        { id: 'bat', label: 'BATTERY • 48V/51.2V', sub: 'Lithium Storage Feed', x: -0.2, color: '#10b981', dir: 'in' as const },
        { id: 'load', label: 'LOAD OUT • 230V AC', sub: 'Critical Sub-Panel', x: 0.35, color: '#c084fc', dir: 'out' as const },
        { id: 'earth', label: 'EARTH ROD • PE', sub: 'Ground Electrode', x: 1.18, color: '#4ade80', dir: 'in' as const },
      ]
    : [
        { id: 'load', label: 'CRITICAL LOAD OUT • 230V', sub: 'From 40A & 30A MCBs', x: 0.25, color: '#c084fc', dir: 'out' as const },
        { id: 'earth', label: 'EARTH ROD • PE', sub: 'Main Ground Electrode', x: 1.18, color: '#4ade80', dir: 'in' as const },
      ];

  return (
    <group position={[0, 0, 0]}>
      {/* --- Enclosure Tub Cabinet (2.90W x 2.56H) --- */}
      <mesh position={[0, 0, -0.015]}>
        <boxGeometry args={[2.86, 2.52, 0.02]} />
        <meshStandardMaterial
          color={backplateColor}
          metalness={isDark ? 0.32 : 0.25}
          roughness={isDark ? 0.48 : 0.42}
        />
      </mesh>

      {/* Outer Metal Enclosure Rim Walls */}
      <mesh position={[0, 1.26, 0.10]}>
        <boxGeometry args={[2.90, 0.05, 0.24]} />
        <meshStandardMaterial color={wallColor} metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[0, -1.26, 0.10]}>
        <boxGeometry args={[2.90, 0.05, 0.24]} />
        <meshStandardMaterial color={wallColor} metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[-1.45, 0, 0.10]}>
        <boxGeometry args={[0.05, 2.57, 0.24]} />
        <meshStandardMaterial color={wallColor} metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[1.45, 0, 0.10]}>
        <boxGeometry args={[0.05, 2.57, 0.24]} />
        <meshStandardMaterial color={wallColor} metalness={0.45} roughness={0.35} />
      </mesh>

      {/* High-Contrast Raised Outer Perimeter Flange & Bevel Lip */}
      <mesh position={[0, 1.275, 0.22]}>
        <boxGeometry args={[2.98, 0.026, 0.018]} />
        <meshStandardMaterial color={flangeColor} metalness={0.4} roughness={0.28} />
      </mesh>
      <mesh position={[0, -1.275, 0.22]}>
        <boxGeometry args={[2.98, 0.026, 0.018]} />
        <meshStandardMaterial color={flangeColor} metalness={0.4} roughness={0.28} />
      </mesh>
      <mesh position={[-1.465, 0, 0.22]}>
        <boxGeometry args={[0.026, 2.57, 0.018]} />
        <meshStandardMaterial color={flangeColor} metalness={0.4} roughness={0.28} />
      </mesh>
      <mesh position={[1.465, 0, 0.22]}>
        <boxGeometry args={[0.026, 2.57, 0.018]} />
        <meshStandardMaterial color={flangeColor} metalness={0.4} roughness={0.28} />
      </mesh>

      {/* Backplate Corner Hex Mounting Bolts */}
      {[
        [-1.34, 1.15],
        [1.34, 1.15],
        [-1.34, -1.15],
        [1.34, -1.15],
      ].map(([x, y], idx) => (
        <mesh key={idx} position={[x, y, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.015, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.25} />
        </mesh>
      ))}

      {/* --- Top 35mm Slotted Aluminum DIN Rail (Y = 0.70, Label at Y = 1.03) --- */}
      <group position={[-0.22, 0.70, 0.01]}>
        <mesh>
          <boxGeometry args={[2.22, 0.12, 0.02]} />
          <meshStandardMaterial color={dinRailSpine} metalness={0.45} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.055, 0.008]}>
          <boxGeometry args={[2.22, 0.015, 0.01]} />
          <meshStandardMaterial color="#ffffff" metalness={0.4} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.055, 0.008]}>
          <boxGeometry args={[2.22, 0.015, 0.01]} />
          <meshStandardMaterial color="#ffffff" metalness={0.4} roughness={0.25} />
        </mesh>
        {Array.from({ length: 19 }).map((_, i) => (
          <mesh key={i} position={[-1.0 + i * 0.11, 0, 0.011]}>
            <boxGeometry args={[0.035, 0.05, 0.005]} />
            <meshStandardMaterial color={dinRailSlots} roughness={0.6} />
          </mesh>
        ))}
        <Text
          position={[-1.08, 0.44, 0.04]}
          fontSize={0.032}
          color={isDark ? '#7dd3fc' : '#0f172a'}
          anchorX="left"
          anchorY="middle"
        >
          TOP RAIL: GRID IN, 100A ATS & INVERTER PROTECTION
        </Text>
      </group>

      {/* --- Middle 35mm Slotted Aluminum DIN Rail (Y = -0.05, Label at Y = +0.30) --- */}
      <group position={[-0.22, -0.05, 0.01]}>
        <mesh>
          <boxGeometry args={[2.22, 0.12, 0.02]} />
          <meshStandardMaterial color={dinRailSpine} metalness={0.45} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.055, 0.008]}>
          <boxGeometry args={[2.22, 0.015, 0.01]} />
          <meshStandardMaterial color="#ffffff" metalness={0.4} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.055, 0.008]}>
          <boxGeometry args={[2.22, 0.015, 0.01]} />
          <meshStandardMaterial color="#ffffff" metalness={0.4} roughness={0.25} />
        </mesh>
        {Array.from({ length: 19 }).map((_, i) => (
          <mesh key={i} position={[-1.0 + i * 0.11, 0, 0.011]}>
            <boxGeometry args={[0.035, 0.05, 0.005]} />
            <meshStandardMaterial color={dinRailSlots} roughness={0.6} />
          </mesh>
        ))}
        <Text
          position={[-1.08, 0.37, 0.04]}
          fontSize={0.031}
          color={isDark ? '#fde68a' : '#78350f'}
          anchorX="left"
          anchorY="middle"
        >
          MIDDLE RAIL: PV STRINGS (1000V DC), METERING & SUB-LOADS
        </Text>
      </group>

      {/* --- Bottom Mounting Zone (Conditional: Battery MCCB or Combiner Raceway Label) --- */}
      {hasBatteryMccb ? (
        <group position={[0, -0.78, 0.005]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.1, 0.32, 0.012]} />
            <meshStandardMaterial color={bottomPlateColor} metalness={0.3} roughness={0.45} />
          </mesh>
          <Text
            position={[-0.5, 0.22, 0.01]}
            fontSize={0.035}
            color={bottomPlateText}
            anchorX="left"
            anchorY="middle"
          >
            CHASSIS MOUNT: 48V/51.2V BATTERY STORAGE MCCB
          </Text>
        </group>
      ) : (
        <group position={[0, -0.84, 0.005]}>
          <mesh position={[-0.15, 0.04, 0]}>
            <boxGeometry args={[2.15, 0.075, 0.012]} />
            <meshStandardMaterial color={isDark ? '#1e293b' : '#475569'} roughness={0.45} />
          </mesh>
          <Text
            position={[-0.15, 0.04, 0.012]}
            fontSize={0.029}
            color="#f8fafc"
            anchorX="center"
            anchorY="middle"
          >
            WIRE RACEWAY: PV & CRITICAL LOAD DISTRIBUTION (COMBINER BOX ONLY)
          </Text>
        </group>
      )}

      {/* --- Right-Side Brass Ground Busbar Mount (X = 1.18) --- */}
      <group position={[1.18, 0.0, 0.01]}>
        <mesh position={[0, 0.28, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.05, 12]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.28, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.05, 12]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.3} />
        </mesh>
        <Text
          position={[0, 0.42, 0.02]}
          fontSize={0.034}
          color={isDark ? '#4ade80' : '#14532d'}
          anchorX="center"
          anchorY="middle"
        >
          PE GROUND
        </Text>
      </group>

      {/* --- Top Wall Cable Glands, Live Feeder Cables & High-Contrast Labels --- */}
      {topKnockouts.map((k) => (
        <group key={`top_k_${k.id}`} position={[k.x, 1.26, 0.08]}>
          {/* Hexagonal Brass Locknut Assembly */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.024, 6]} />
            <meshStandardMaterial color={glandNutColor} metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.015, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>

          {/* Routed Live Feeder Cables Entering Directly Toward Rail Terminals */}
          {k.id === 'grid' && (
            <>
              <FeederCable
                points={[
                  [-0.018, 0.02, 0.01],
                  [-0.035, -0.14, 0.04],
                  [-0.042, -0.30, 0.02],
                ]}
                color="#f97316"
                isEnergized={isEnergized}
              />
              <FeederCable
                points={[
                  [0.018, 0.02, 0.01],
                  [0.035, -0.14, 0.04],
                  [0.042, -0.30, 0.02],
                ]}
                color="#3b82f6"
                isEnergized={isEnergized}
              />
            </>
          )}

          {k.id === 'inv' && (
            <>
              <FeederCable
                points={[
                  [-0.018, 0.02, 0.01],
                  [-0.035, -0.14, 0.04],
                  [-0.042, -0.30, 0.02],
                ]}
                color="#ef4444"
                isEnergized={isEnergized}
              />
              <FeederCable
                points={[
                  [0.018, 0.02, 0.01],
                  [0.035, -0.14, 0.04],
                  [0.042, -0.30, 0.02],
                ]}
                color="#3b82f6"
                isEnergized={isEnergized}
              />
            </>
          )}

          {k.id === 'pv1' && (
            <>
              <FeederCable
                points={[
                  [-0.018, 0.02, 0.01],
                  [-0.25, -0.12, 0.03],
                  [-0.68, -0.16, 0.03],
                  [-0.68, -0.88, 0.03],
                  [-0.532, -1.05, 0.02],
                ]}
                color="#ef4444"
                isEnergized={isEnergized}
              />
              <FeederCable
                points={[
                  [0.018, 0.02, 0.01],
                  [-0.20, -0.15, 0.03],
                  [-0.64, -0.19, 0.03],
                  [-0.64, -0.90, 0.03],
                  [-0.448, -1.05, 0.02],
                ]}
                color="#1e293b"
                isEnergized={isEnergized}
              />
            </>
          )}

          {k.id === 'pv_out' && (
            <>
              <FeederCable
                points={[
                  [-0.018, 0.02, 0.01],
                  [-0.018, -0.82, 0.03],
                  [-0.35, -1.78, 0.04],
                  [-1.37, -1.78, 0.03],
                  [-1.37, -1.57, 0.02],
                ]}
                color="#ef4444"
                radius={0.007}
                isEnergized={isEnergized}
              />
              <FeederCable
                points={[
                  [0.018, 0.02, 0.01],
                  [0.018, -0.86, 0.03],
                  [-0.30, -1.82, 0.04],
                  [-1.28, -1.82, 0.03],
                  [-1.28, -1.57, 0.02],
                ]}
                color="#1e293b"
                radius={0.007}
                isEnergized={isEnergized}
              />
            </>
          )}

          {/* High-Contrast Circuit Indicator Pill (Geometric Direction Cone + Clean Text) */}
          <group position={[0, 0.14, 0.02]}>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[0.41, 0.088]} />
              <meshBasicMaterial color={k.color} />
            </mesh>
            <mesh position={[0, 0, 0.002]}>
              <planeGeometry args={[0.40, 0.078]} />
              <meshBasicMaterial color="#090d16" />
            </mesh>
            {/* Geometric 3D Arrow Cone (Down for IN, Up for OUT) */}
            <mesh
              position={[-0.165, 0.012, 0.006]}
              rotation={[0, 0, k.dir === 'in' ? Math.PI : 0]}
            >
              <coneGeometry args={[0.012, 0.024, 3]} />
              <meshBasicMaterial color={k.color} />
            </mesh>
            <Text
              position={[0.015, 0.014, 0.006]}
              fontSize={0.022}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {k.label}
            </Text>
            <Text
              position={[0, -0.018, 0.006]}
              fontSize={0.015}
              color={k.color}
              anchorX="center"
              anchorY="middle"
            >
              {k.sub}
            </Text>
          </group>
        </group>
      ))}

      {/* --- Bottom Wall Cable Glands, Outgoing Load & Earth Conductors --- */}
      {bottomKnockouts.map((k) => (
        <group key={`bot_k_${k.id}`} position={[k.x, -1.26, 0.08]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.054, 0.054, 0.024, 6]} />
            <meshStandardMaterial color={glandNutColor} metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.015, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.044, 0.044, 0.02, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>

          {k.id === 'bat' && (
            <group position={[0, 0.14, 0.01]}>
              <mesh position={[-0.025, 0, 0]}>
                <cylinderGeometry args={[0.014, 0.014, 0.24, 16]} />
                <meshStandardMaterial color="#ef4444" roughness={0.35} />
              </mesh>
              <mesh position={[0.025, 0, 0]}>
                <cylinderGeometry args={[0.014, 0.014, 0.24, 16]} />
                <meshStandardMaterial color="#1e293b" roughness={0.35} />
              </mesh>
            </group>
          )}

          {k.id === 'load' && (
            <>
              <FeederCable
                points={[
                  [-0.02, -0.02, 0.01],
                  [-0.05, 0.35, 0.03],
                  [-0.13, 0.95, 0.02],
                ]}
                color="#ef4444"
                isEnergized={isEnergized}
              />
              <FeederCable
                points={[
                  [0.02, -0.02, 0.01],
                  [0.05, 0.35, 0.03],
                  [0.14, 0.95, 0.02],
                ]}
                color="#3b82f6"
                isEnergized={isEnergized}
              />
            </>
          )}

          {k.id === 'earth' && (
            <FeederCable
              points={[
                [0, -0.02, 0.01],
                [0, 0.55, 0.02],
                [0, 0.96, 0.01],
              ]}
              color="#22c55e"
              radius={0.011}
              isEnergized={isEnergized}
            />
          )}

          {/* Bottom High-Contrast Circuit Indicator Pill */}
          <group position={[0, -0.14, 0.02]}>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[0.42, 0.088]} />
              <meshBasicMaterial color={k.color} />
            </mesh>
            <mesh position={[0, 0, 0.002]}>
              <planeGeometry args={[0.41, 0.078]} />
              <meshBasicMaterial color="#090d16" />
            </mesh>
            <mesh
              position={[-0.17, 0.012, 0.006]}
              rotation={[0, 0, k.dir === 'in' ? 0 : Math.PI]}
            >
              <coneGeometry args={[0.012, 0.024, 3]} />
              <meshBasicMaterial color={k.color} />
            </mesh>
            <Text
              position={[0.015, 0.014, 0.006]}
              fontSize={0.021}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {k.label}
            </Text>
            <Text
              position={[0, -0.018, 0.006]}
              fontSize={0.015}
              color={k.color}
              anchorX="center"
              anchorY="middle"
            >
              {k.sub}
            </Text>
          </group>
        </group>
      ))}
    </group>
  );
}
