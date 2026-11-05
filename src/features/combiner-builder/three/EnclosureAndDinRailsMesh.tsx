// src/features/combiner-builder/three/EnclosureAndDinRailsMesh.tsx
import { Text } from '@react-three/drei';

export function EnclosureAndDinRailsMesh() {
  return (
    <group position={[0, 0, 0]}>
      {/* --- Main Enclosure Housing --- */}
      {/* Outer Enclosure Box (Dark slate powder-coated metal, IP65 waterproof look) */}
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[2.8, 2.3, 0.22]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>

      {/* Interior Backplate (Galvanized Steel Backing Plate) */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[2.62, 2.12, 0.02]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* Backplate Corner Mounting Screws */}
      {[
        [-1.25, 0.98],
        [1.25, 0.98],
        [-1.25, -0.98],
        [1.25, -0.98],
      ].map(([x, y], idx) => (
        <mesh key={idx} position={[x, y, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.015, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* --- Top 35mm Aluminum DIN Rail (AC & ATS Section) --- */}
      <group position={[-0.1, 0.75, 0.01]}>
        {/* Main DIN Rail Spine */}
        <mesh>
          <boxGeometry args={[2.1, 0.14, 0.025]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.88} roughness={0.28} />
        </mesh>
        {/* DIN Rail Top Lip */}
        <mesh position={[0, 0.065, 0.01]}>
          <boxGeometry args={[2.1, 0.02, 0.015]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* DIN Rail Bottom Lip */}
        <mesh position={[0, -0.065, 0.01]}>
          <boxGeometry args={[2.1, 0.02, 0.015]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* DIN Rail Slots */}
        {Array.from({ length: 18 }).map((_, i) => (
          <mesh key={i} position={[-0.95 + i * 0.11, 0, 0.013]}>
            <boxGeometry args={[0.04, 0.06, 0.005]} />
            <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.6} />
          </mesh>
        ))}
        {/* Rail Section Header Label */}
        <Text
          position={[-1.0, 0.16, 0.01]}
          fontSize={0.045}
          color="#38bdf8"
          anchorX="left"
          anchorY="middle"
        >
          TOP DIN-RAIL: AC MAINS, ATS DUAL-POWER & RCBO
        </Text>
      </group>

      {/* --- Middle 35mm Aluminum DIN Rail (PV DC Strings & Sub-Loads) --- */}
      <group position={[-0.1, 0.05, 0.01]}>
        <mesh>
          <boxGeometry args={[2.1, 0.14, 0.025]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.88} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.065, 0.01]}>
          <boxGeometry args={[2.1, 0.02, 0.015]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.065, 0.01]}>
          <boxGeometry args={[2.1, 0.02, 0.015]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {Array.from({ length: 18 }).map((_, i) => (
          <mesh key={i} position={[-0.95 + i * 0.11, 0, 0.013]}>
            <boxGeometry args={[0.04, 0.06, 0.005]} />
            <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.6} />
          </mesh>
        ))}
        <Text
          position={[-1.0, 0.16, 0.01]}
          fontSize={0.045}
          color="#f59e0b"
          anchorX="left"
          anchorY="middle"
        >
          MIDDLE DIN-RAIL: PV STRINGS (1000V DC) & SUB-BREAKERS
        </Text>
      </group>

      {/* --- Bottom Heavy Mounting Zone (Battery MCCB) --- */}
      <group position={[0, -0.72, 0.005]}>
        {/* Heavy Mounting Standoff Brackets */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 0.38, 0.015]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        </mesh>
        <Text
          position={[-0.55, 0.24, 0.01]}
          fontSize={0.042}
          color="#ef4444"
          anchorX="left"
          anchorY="middle"
        >
          CHASSIS MOUNT: 48V/51.2V BATTERY STORAGE MCCB
        </Text>
      </group>

      {/* --- Right-Side Brass Ground Busbar Mount --- */}
      <group position={[1.18, 0.1, 0.01]}>
        {/* Blue Insulating Standoff Pillars */}
        <mesh position={[0, 0.35, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.06, 12]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.35, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.06, 12]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.3} />
        </mesh>

        <Text
          position={[0, 0.52, 0.02]}
          fontSize={0.038}
          color="#22c55e"
          anchorX="center"
          anchorY="middle"
        >
          PE GROUND
        </Text>
      </group>

      {/* --- Cable Gland Entry Knockouts (Top & Bottom) --- */}
      {/* Top Knockouts */}
      {[
        { label: 'PV1 DC', x: -0.9 },
        { label: 'PV2 DC', x: -0.5 },
        { label: 'GRID IN', x: 0.1 },
        { label: 'INVERTER', x: 0.5 },
        { label: 'LOAD OUT', x: 0.9 },
      ].map((k, i) => (
        <group key={`top_k_${i}`} position={[k.x, 1.1, 0.02]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.04, 16]} />
            <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.2} />
          </mesh>
          <Text
            position={[0, 0.08, 0]}
            fontSize={0.032}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
          >
            {k.label}
          </Text>
        </group>
      ))}

      {/* Bottom Knockouts (Heavy Battery Cable + Ground Rod) */}
      {[
        { label: 'BATTERY + / -', x: -0.2 },
        { label: 'EARTH ROD', x: 1.18 },
      ].map((k, i) => (
        <group key={`bot_k_${i}`} position={[k.x, -1.1, 0.02]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
            <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.2} />
          </mesh>
          <Text
            position={[0, -0.08, 0]}
            fontSize={0.032}
            color="#94a3b8"
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
