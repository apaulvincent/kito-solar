// src/components/diagram/SolarScene.tsx
import { useMemo, useRef, useEffect } from 'react';
import { OrbitControls, Grid, ContactShadows } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { DiagramNodeKey, CableConnection } from '@/types/diagram';
import { DiagramNodeMesh } from './DiagramNodeMesh';
import { PowerFlowCables } from './PowerFlowCables';
import { CONDUIT_ROUTES } from './conduitRoutes';

interface SolarSceneProps {
  isAnimationPaused?: boolean;
  resetViewCount?: number;
}

interface ArchitecturalWallBackboardProps {
  isDark: boolean;
}

function ArchitecturalWallBackboard({ isDark }: ArchitecturalWallBackboardProps) {
  // Standoff mount coordinates for heavy-duty backboard mounting
  const standoffPositions: [number, number][] = [
    [-6.4, 4.1],
    [-2.0, 4.1],
    [2.8, 4.1],
    [7.8, 4.1],
    [-6.4, 0.5],
    [-2.0, 0.5],
    [2.8, 0.5],
    [7.8, 0.5],
  ];

  // Slotted channel punch-hole positions along unistrut rails
  const unistrutHoleOffsets = [-6.0, -4.5, -3.0, -1.5, 0.0, 1.5, 3.0, 4.5, 6.0, 7.5];

  return (
    <group>
      {/* 1. Main Structural Plant Room Wall: 26.0m x 7.2m x 0.25m at [0.7, 2.8, -0.28] */}
      <mesh position={[0.7, 2.8, -0.28]} receiveShadow>
        <boxGeometry args={[26.0, 7.2, 0.25]} />
        <meshStandardMaterial
          color={isDark ? '#0F172A' : '#E2E8F0'}
          roughness={0.88}
          metalness={0.08}
        />
      </mesh>

      {/* Wall Baseboard Skirting: 26.0m along bottom floor junction */}
      <mesh position={[0.7, 0.08, -0.14]} receiveShadow>
        <boxGeometry args={[26.0, 0.16, 0.04]} />
        <meshStandardMaterial
          color={isDark ? '#1E293B' : '#CBD5E1'}
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* 2. Industrial Equipment Mounting Backboard: 14.6m x 4.2m x 0.06m at [0.7, 2.3, -0.12] */}
      <mesh position={[0.7, 2.3, -0.12]} receiveShadow>
        <boxGeometry args={[14.6, 4.2, 0.06]} />
        <meshStandardMaterial
          color={isDark ? '#1E293B' : '#F8FAFC'}
          roughness={0.45}
          metalness={0.15}
        />
      </mesh>

      {/* Backboard Aluminum Perimeter Bevel Trim Frame */}
      <mesh position={[0.7, 2.3, -0.09]}>
        <boxGeometry args={[14.64, 4.24, 0.01]} />
        <meshStandardMaterial
          color={isDark ? '#334155' : '#E2E8F0'}
          metalness={0.6}
          roughness={0.3}
          wireframe={false}
        />
      </mesh>

      {/* Backboard Heavy-Duty Fastener Rosettes with Hex Lag Bolts */}
      {standoffPositions.map(([bx, by], idx) => (
        <group key={`standoff-${idx}`} position={[bx, by, -0.08]}>
          {/* Circular Rosette Washer */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.02, 16]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Hexagonal Lag Screw Head */}
          <mesh position={[0, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.02, 6]} />
            <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.18} />
          </mesh>
        </group>
      ))}

      {/* 3. Dual Horizontal Galvanized Steel Unistrut Channels (Standard P1000 41x41mm) */}
      {/* Upper Unistrut Channel: Y = 2.9m */}
      <group position={[0.7, 2.9, -0.07]}>
        {/* Main Solid Channel Body */}
        <mesh receiveShadow castShadow>
          <boxGeometry args={[14.4, 0.08, 0.04]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.86} roughness={0.22} />
        </mesh>
        {/* Channel Inset Groove (Open Slotted Face) */}
        <mesh position={[0, 0, 0.015]}>
          <boxGeometry args={[14.36, 0.04, 0.015]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* Slotted Punchout Holes / Spring Nut Clamps */}
        {unistrutHoleOffsets.map((hx, hIdx) => (
          <mesh key={`uh-upper-${hIdx}`} position={[hx, 0, 0.021]}>
            <boxGeometry args={[0.06, 0.025, 0.005]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Lower Unistrut Channel: Y = 1.4m */}
      <group position={[0.7, 1.4, -0.07]}>
        {/* Main Solid Channel Body */}
        <mesh receiveShadow castShadow>
          <boxGeometry args={[14.4, 0.08, 0.04]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.86} roughness={0.22} />
        </mesh>
        {/* Channel Inset Groove (Open Slotted Face) */}
        <mesh position={[0, 0, 0.015]}>
          <boxGeometry args={[14.36, 0.04, 0.015]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* Slotted Punchout Holes / Spring Nut Clamps */}
        {unistrutHoleOffsets.map((hx, hIdx) => (
          <mesh key={`uh-lower-${hIdx}`} position={[hx, 0, 0.021]}>
            <boxGeometry args={[0.06, 0.025, 0.005]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* 4. Polished Concrete Studio Floor Slab: 26.0m x 0.12m x 9.2m at [0.7, -0.06, 2.6] */}
      <mesh position={[0.7, -0.06, 2.6]} receiveShadow>
        <boxGeometry args={[26.0, 0.12, 9.2]} />
        <meshStandardMaterial
          color={isDark ? '#1E293B' : '#CBD5E1'}
          roughness={0.75}
          metalness={0.12}
        />
      </mesh>
    </group>
  );
}

export function SolarScene({ isAnimationPaused = false, resetViewCount = 0 }: SolarSceneProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!resetViewCount) return;
    camera.position.set(0.6, 4.0, 16.0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0.6, 2.4, 0);
      controlsRef.current.update();
    }
  }, [resetViewCount, camera]);

  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const gridVoltageV = useCalculatorStore((s) => s.gridVoltageV);
  const isHybrid = calculationResult.systemType === 'hybrid' && calculationResult.battery.hasBattery;

  // Calibrated equipment coordinates flush against architectural wall backboard
  const nodePositions = useMemo<Record<DiagramNodeKey, [number, number, number]>>(() => {
    return {
      pv_array: [-7.8, 0.75, 2.2],
      dc_isolator: [-5.4, 2.9, 0.0],
      dc_breaker: [-3.6, 2.9, 0.0],
      dc_spd: [-3.6, 1.4, 0.0],
      dc_conduit: [-5.0, 2.9, 0.0],
      inverter: [-0.6, 3.35, 0.0],
      battery_breaker: [-2.0, 1.4, 0.0],
      battery: [-0.6, 0.80, 0.4],
      battery_wire: [-1.4, 0.4, 0.4],
      ac_breaker: [1.4, 2.9, 0.0],
      ac_spd: [1.4, 1.4, 0.0],
      ac_isolator: [2.9, 2.9, 0.0],
      main_panel: [4.6, 2.5, 0.0],
      ats: [5.95, 2.5, 0.0],
      eps_breaker: [5.95, 1.4, 0.0],
      grid: [10.2, 1.6, 0.0],
      load: [10.2, 0.8, 2.2],
      grounding: [4.6, 0.75, 0.0],
    };
  }, []);

  // Corrected electrical sequence conduit connections
  const cables = useMemo<CableConnection[]>(() => {
    const list: CableConnection[] = [...CONDUIT_ROUTES];

    if (isHybrid) {
      list.push(
        // 12. Inverter to Battery Breaker (Hybrid Vertical Drop & 90° Turn above Battery)
        {
          id: 'c-inv-batbrk',
          from: 'inverter',
          to: 'battery_breaker',
          type: 'battery',
          color: '#059669',
          bidirectional: true,
          waypoints: [
            [-0.6, 3.35, 0.0],
            [-0.6, 2.2, 0.0],
            [-2.0, 2.2, 0.0],
            [-2.0, 1.4, 0.0],
          ],
        },
        // 13. Battery Breaker to Battery Storage (Hybrid Conduit to Powerwall)
        {
          id: 'c-batbrk-bat',
          from: 'battery_breaker',
          to: 'battery',
          type: 'battery',
          color: '#059669',
          bidirectional: true,
          waypoints: [
            [-2.0, 1.4, 0.0],
            [-2.0, 0.4, 0.0],
            [-1.4, 0.4, 0.0],
            [-1.4, 0.4, 0.4],
            [-0.6, 0.4, 0.4],
          ],
        }
      );
    }

    return list;
  }, [isHybrid]);

  const theme = useCalculatorStore((s) => s.theme);
  const isDark = theme === 'dark';

  return (
    <>
      {/* Studio Lighting */}
      <color attach="background" args={[isDark ? '#0F172A' : '#F1F5F9']} />
      <ambientLight intensity={isDark ? 0.95 : 1.25} />
      <directionalLight
        position={[12, 22, 16]}
        intensity={isDark ? 1.8 : 1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={8}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
        shadow-bias={-0.0001}
      />
      {/* Soft Sky Fill Light */}
      <directionalLight position={[-14, 12, 8]} intensity={isDark ? 0.65 : 0.75} color="#BAE6FD" />
      {/* Studio Rim Light for metallic specular glints */}
      <directionalLight position={[0, 16, -10]} intensity={isDark ? 0.75 : 0.55} color="#FEF08A" />

      {/* Architectural Wall Backboard & Floor Structure */}
      <ArchitecturalWallBackboard isDark={isDark} />

      {/* Floor & Wall Contact Shadows for authentic physical grounding */}
      <ContactShadows
        position={[0.7, 0.002, 2.6]}
        opacity={isDark ? 0.65 : 0.4}
        scale={28}
        blur={1.8}
        far={6}
        resolution={1024}
        color={isDark ? '#020617' : '#334155'}
      />
      <ContactShadows
        position={[0.7, 2.3, -0.08]}
        rotation={[Math.PI / 2, 0, 0]}
        opacity={isDark ? 0.55 : 0.3}
        scale={[14, 4]}
        blur={1.5}
        far={2}
        resolution={1024}
        color={isDark ? '#020617' : '#334155'}
      />

      {/* Architectural Floor Grid atop Concrete Slab */}
      <Grid
        position={[0.7, 0.004, 2.6]}
        args={[26, 9.2]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor={isDark ? '#334155' : '#CBD5E1'}
        sectionSize={2}
        sectionThickness={0.9}
        sectionColor={isDark ? '#475569' : '#94A3B8'}
        fadeDistance={32}
        fadeStrength={1.2}
      />

      {/* DC Generation & Point-of-Entry Sequence: PV -> Isolator -> Breaker -> SPD -> Inverter */}
      <DiagramNodeMesh
        nodeKey="pv_array"
        label="PV ARRAY"
        sublabel={`${calculationResult.summary.totalPanels}x Modules`}
        position={nodePositions.pv_array}
        color="#0284C7"
        nodeType="pv"
      />
      <DiagramNodeMesh
        nodeKey="dc_isolator"
        label="DC ISOLATOR"
        sublabel={`${calculationResult.dc.isolatorRatingA}A`}
        position={nodePositions.dc_isolator}
        color="#D97706"
        nodeType="isolator"
      />
      <DiagramNodeMesh
        nodeKey="dc_breaker"
        label="DC BREAKER"
        sublabel={`${calculationResult.dc.breakerRatingA}A`}
        position={nodePositions.dc_breaker}
        color="#DC2626"
        nodeType="breaker"
      />
      <DiagramNodeMesh
        nodeKey="dc_spd"
        label="DC SPD"
        sublabel={calculationResult.dc.spdRating}
        position={nodePositions.dc_spd}
        color="#059669"
        nodeType="spd"
      />

      {/* Central Solar Inverter */}
      <DiagramNodeMesh
        nodeKey="inverter"
        label="SOLAR INVERTER"
        sublabel={`${calculationResult.summary.inverterPowerKw} kW ${calculationResult.systemType.toUpperCase()}`}
        position={nodePositions.inverter}
        color="#D97706"
        nodeType="inverter"
      />

      {/* Hybrid Battery Storage System */}
      {isHybrid && (
        <>
          <DiagramNodeMesh
            nodeKey="battery_breaker"
            label="BATTERY MCCB"
            sublabel={`${calculationResult.battery.recommendedBreakerA}A`}
            position={nodePositions.battery_breaker}
            color="#059669"
            nodeType="breaker"
          />
          <DiagramNodeMesh
            nodeKey="battery"
            label="BATTERY STORAGE"
            sublabel={`${(calculationResult.battery.totalEnergyWh / 1000).toFixed(1)} kWh`}
            position={nodePositions.battery}
            color="#059669"
            nodeType="battery"
          />
        </>
      )}

      {/* AC Distribution Nodes */}
      <DiagramNodeMesh
        nodeKey="ac_breaker"
        label="AC BREAKER"
        sublabel={`${calculationResult.ac.breakerRatingA}A`}
        position={nodePositions.ac_breaker}
        color="#0284C7"
        nodeType="breaker"
      />
      <DiagramNodeMesh
        nodeKey="ac_spd"
        label="AC SPD"
        sublabel={calculationResult.ac.spdRating}
        position={nodePositions.ac_spd}
        color="#059669"
        nodeType="spd"
      />
      <DiagramNodeMesh
        nodeKey="ac_isolator"
        label="AC ISOLATOR"
        sublabel={`${calculationResult.ac.isolatorRatingA}A`}
        position={nodePositions.ac_isolator}
        color="#D97706"
        nodeType="isolator"
      />
      <DiagramNodeMesh
        nodeKey="main_panel"
        label="MAIN SERVICE PANEL"
        sublabel="Distribution"
        position={nodePositions.main_panel}
        color="#475569"
        nodeType="panel"
      />
      <DiagramNodeMesh
        nodeKey="ats"
        label="AUTOMATIC TRANSFER SWITCH"
        sublabel={calculationResult.ac.atsConfigured ? `${calculationResult.ac.atsRatingA}A` : 'BYPASS'}
        position={nodePositions.ats}
        color="#7C3AED"
        nodeType="ats"
      />
      <DiagramNodeMesh
        nodeKey="grid"
        label="UTILITY GRID"
        sublabel={`${gridVoltageV}V AC`}
        position={nodePositions.grid}
        color="#64748B"
        nodeType="grid"
      />
      <DiagramNodeMesh
        nodeKey="load"
        label="BUILDING LOAD"
        sublabel="Consumer Circuit"
        position={nodePositions.load}
        color="#0284C7"
        nodeType="load"
      />

      {/* Grounding Copper Busbar (Interactive 3D CAD Node) */}
      <DiagramNodeMesh
        nodeKey="grounding"
        label="COPPER GROUND BUSBAR"
        sublabel="UL 467 / NEC 250"
        position={nodePositions.grounding}
        color="#D97706"
        nodeType="grounding"
      />

      {/* Real-time Orthogonal EMT Conduit Runs & Animated Particle Current */}
      <PowerFlowCables
        cables={cables}
        nodePositions={nodePositions}
        isAnimationPaused={isAnimationPaused}
      />

      {/* Calibrated Centered Isometric OrbitControls */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0.6, 2.4, 0]}
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={32}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minPolarAngle={0.1}
      />
    </>
  );
}
