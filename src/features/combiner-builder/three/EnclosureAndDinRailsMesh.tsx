// src/features/combiner-builder/three/EnclosureAndDinRailsMesh.tsx
import { Text } from '@react-three/drei';

export function EnclosureAndDinRailsMesh() {
  return (
    <group position={[0, 0, 0]}>
      {/* --- Enclosure Tub Cabinet (Industrial Powder-Coated Dark Gray Steel) --- */}
      {/* Dark Gray Interior Mounting Backplate */}
      <mesh position={[0, 0, -0.015]}>
        <boxGeometry args={[2.64, 2.42, 0.02]} />
        <meshStandardMaterial
          color="#23272f"
          metalness={0.55}
          roughness={0.4}
        />
      </mesh>

      {/* Outer Metal Enclosure Rim Walls (Dark Gray open-front conduit cabinet) */}
      {/* Top Wall */}
      <mesh position={[0, 1.21, 0.09]}>
        <boxGeometry args={[2.66, 0.04, 0.22]} />
        <meshStandardMaterial color="#323842" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Bottom Wall */}
      <mesh position={[0, -1.21, 0.09]}>
        <boxGeometry args={[2.66, 0.04, 0.22]} />
        <meshStandardMaterial color="#323842" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Left Wall */}
      <mesh position={[-1.33, 0, 0.09]}>
        <boxGeometry args={[0.04, 2.46, 0.22]} />
        <meshStandardMaterial color="#323842" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Right Wall */}
      <mesh position={[1.33, 0, 0.09]}>
        <boxGeometry args={[0.04, 2.46, 0.22]} />
        <meshStandardMaterial color="#323842" metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Backplate Corner Hex Bolts */}
      {[
        [-1.24, 1.12],
        [1.24, 1.12],
        [-1.24, -1.12],
        [1.24, -1.12],
      ].map(([x, y], idx) => (
        <mesh key={idx} position={[x, y, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.015, 12]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* --- Top 35mm Slotted Aluminum DIN Rail (AC & ATS Section) --- */}
      <group position={[-0.1, 0.62, 0.01]}>
        {/* Main Rail Spine */}
        <mesh>
          <boxGeometry args={[2.08, 0.12, 0.02]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Top & Bottom Lips */}
        <mesh position={[0, 0.055, 0.008]}>
          <boxGeometry args={[2.08, 0.015, 0.01]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.055, 0.008]}>
          <boxGeometry args={[2.08, 0.015, 0.01]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Rail Slots */}
        {Array.from({ length: 18 }).map((_, i) => (
          <mesh key={i} position={[-0.94 + i * 0.11, 0, 0.011]}>
            <boxGeometry args={[0.035, 0.05, 0.005]} />
            <meshStandardMaterial color="#14171c" roughness={0.6} />
          </mesh>
        ))}
        {/* Rail Title Header */}
        <Text
          position={[-0.98, 0.13, 0.01]}
          fontSize={0.038}
          color="#38bdf8"
          anchorX="left"
          anchorY="middle"
        >
          TOP DIN-RAIL: AC MAINS, ATS DUAL-POWER & RCBO
        </Text>
      </group>

      {/* --- Middle 35mm Slotted Aluminum DIN Rail (PV Strings & Sub-Loads) --- */}
      <group position={[-0.1, -0.05, 0.01]}>
        <mesh>
          <boxGeometry args={[2.08, 0.12, 0.02]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.055, 0.008]}>
          <boxGeometry args={[2.08, 0.015, 0.01]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.055, 0.008]}>
          <boxGeometry args={[2.08, 0.015, 0.01]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.15} />
        </mesh>
        {Array.from({ length: 18 }).map((_, i) => (
          <mesh key={i} position={[-0.94 + i * 0.11, 0, 0.011]}>
            <boxGeometry args={[0.035, 0.05, 0.005]} />
            <meshStandardMaterial color="#14171c" roughness={0.6} />
          </mesh>
        ))}
        <Text
          position={[-0.98, 0.13, 0.01]}
          fontSize={0.038}
          color="#f59e0b"
          anchorX="left"
          anchorY="middle"
        >
          MIDDLE DIN-RAIL: PV STRINGS (1000V DC) & SUB-BREAKERS
        </Text>
      </group>

      {/* --- Bottom Heavy Mounting Zone (Battery MCCB) --- */}
      <group position={[0, -0.72, 0.005]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.1, 0.32, 0.012]} />
          <meshStandardMaterial color="#1a1d22" metalness={0.7} roughness={0.35} />
        </mesh>
        <Text
          position={[-0.5, 0.20, 0.01]}
          fontSize={0.035}
          color="#ef4444"
          anchorX="left"
          anchorY="middle"
        >
          CHASSIS MOUNT: 48V/51.2V BATTERY STORAGE MCCB
        </Text>
      </group>

      {/* --- Right-Side Brass Ground Busbar Mount --- */}
      <group position={[1.08, 0.0, 0.01]}>
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
          color="#22c55e"
          anchorX="center"
          anchorY="middle"
        >
          PE GROUND
        </Text>
      </group>

      {/* --- Cable Gland Entry Knockouts (Top & Bottom) --- */}
      {[
        { label: 'PV1 DC', x: -0.85 },
        { label: 'PV2 DC', x: -0.45 },
        { label: 'GRID IN', x: 0.1 },
        { label: 'INVERTER', x: 0.5 },
        { label: 'LOAD OUT', x: 0.85 },
      ].map((k, i) => (
        <group key={`top_k_${i}`} position={[k.x, 1.2, 0.08]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.05, 16]} />
            <meshStandardMaterial color="#181b20" metalness={0.8} roughness={0.3} />
          </mesh>
          <Text
            position={[0, 0.08, 0]}
            fontSize={0.028}
            color="#9ca3af"
            anchorX="center"
            anchorY="middle"
          >
            {k.label}
          </Text>
        </group>
      ))}

      {[
        { label: 'BATTERY + / -', x: -0.2 },
        { label: 'EARTH ROD', x: 1.08 },
      ].map((k, i) => (
        <group key={`bot_k_${i}`} position={[k.x, -1.2, 0.08]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.05, 16]} />
            <meshStandardMaterial color="#181b20" metalness={0.8} roughness={0.3} />
          </mesh>
          <Text
            position={[0, -0.08, 0]}
            fontSize={0.028}
            color="#9ca3af"
            anchorX="center"
            anchorY="middle"
          >
            {k.label}
          </Text>
        </group>
      ))}
    </group>
  );
}
