// src/components/diagram/SolarScene.tsx
import { useMemo, useRef, useEffect, useCallback } from 'react';
import { OrbitControls, Grid, ContactShadows } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { DiagramNodeKey } from '@/types/diagram';
import { PLANT_ROOM_GEOMETRY } from '@/types/layout3d';
import { DEFAULT_BASE_NODE_POSITIONS } from '@/lib/layout3dEngine';
import { DiagramNodeMesh } from './DiagramNodeMesh';
import { PlacedComponentMesh } from './PlacedComponentMesh';
import { CustomWireSystem } from './CustomWireSystem';

interface SolarSceneProps {
  isAnimationPaused?: boolean;
  resetViewCount?: number;
}

interface ArchitecturalWallBackboardProps {
  isDark: boolean;
}

const STANDOFF_XS = [-16.4, -10.8, -5.2, 0.7, 6.6, 12.2, 17.8];
const UNISTRUT_HOLE_XS = Array.from({ length: 23 }, (_, i) => -16.5 + i * 1.5);

function ArchitecturalWallBackboard({ isDark }: ArchitecturalWallBackboardProps) {
  const { centerX, wall, backboard, floor } = PLANT_ROOM_GEOMETRY;
  const standoffPositions: [number, number][] = [];
  for (const sx of STANDOFF_XS) {
    standoffPositions.push([sx, 6.6], [sx, 0.6]);
  }

  return (
    <group>
      {/* 1. Expanded Commercial Structural Plant Room Wall: 44.0m x 9.6m x 0.25m */}
      <mesh position={[centerX, wall.height / 2 - 0.06, wall.z]} receiveShadow>
        <boxGeometry args={[wall.width, wall.height, wall.thickness]} />
        <meshStandardMaterial
          color={isDark ? '#0F172A' : '#E2E8F0'}
          roughness={0.88}
          metalness={0.08}
        />
      </mesh>

      {/* Wall Baseboard Skirting: 44.0m along bottom floor junction */}
      <mesh position={[centerX, 0.08, -0.14]} receiveShadow>
        <boxGeometry args={[wall.width, 0.16, 0.04]} />
        <meshStandardMaterial
          color={isDark ? '#1E293B' : '#CBD5E1'}
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* 2. Commercial Equipment Mounting Backboard: 36.0m x 6.6m x 0.06m */}
      <mesh position={[centerX, backboard.centerY, -0.12]} receiveShadow>
        <boxGeometry args={[backboard.width, backboard.height, 0.06]} />
        <meshStandardMaterial
          color={isDark ? '#1E293B' : '#F8FAFC'}
          roughness={0.45}
          metalness={0.15}
        />
      </mesh>

      {/* Backboard Aluminum Perimeter Bevel Trim Frame */}
      <mesh position={[centerX, backboard.centerY, -0.09]}>
        <boxGeometry args={[backboard.width + 0.06, backboard.height + 0.06, 0.01]} />
        <meshStandardMaterial
          color={isDark ? '#334155' : '#E2E8F0'}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Backboard Heavy-Duty Fastener Rosettes with Hex Lag Bolts */}
      {standoffPositions.map(([bx, by], idx) => (
        <group key={`standoff-${idx}`} position={[bx, by, -0.08]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.02, 16]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.02, 6]} />
            <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.18} />
          </mesh>
        </group>
      ))}

      {/* 3. Quadruple Horizontal Galvanized Steel Unistrut Channels (Y = 1.4m, 2.9m, 4.4m, 5.6m) */}
      {backboard.unistrutYTiers.map((tierY) => (
        <group key={`unistrut-${tierY}`} position={[centerX, tierY, -0.07]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[backboard.width - 0.4, 0.08, 0.04]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.86} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0, 0.015]}>
            <boxGeometry args={[backboard.width - 0.44, 0.04, 0.015]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
          </mesh>
          {UNISTRUT_HOLE_XS.map((hx, hIdx) => (
            <mesh key={`uh-${tierY}-${hIdx}`} position={[hx, 0, 0.021]}>
              <boxGeometry args={[0.06, 0.025, 0.005]} />
              <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}

      {/* 4. Expanded Polished Concrete Commercial Floor Slab: 44.0m x 0.12m x 20.0m */}
      <mesh position={[centerX, -0.06, floor.centerZ]} receiveShadow>
        <boxGeometry args={[floor.width, 0.12, floor.depth]} />
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
  const wireStartTriggerRef = useRef<
    ((nodeId: string, clientX: number, clientY: number) => boolean) | null
  >(null);

  const handleLockControls = useCallback((locked: boolean) => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !locked;
    }
  }, []);

  const handleWireStart = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      if (wireStartTriggerRef.current) {
        return wireStartTriggerRef.current(nodeId, clientX, clientY);
      }
      return false;
    },
    []
  );

  useEffect(() => {
    if (!resetViewCount) return;
    camera.position.set(0.6, 4.4, 18.5);
    if (controlsRef.current) {
      controlsRef.current.target.set(0.6, 2.5, 0.5);
      controlsRef.current.update();
    }
  }, [resetViewCount, camera]);

  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const gridVoltageV = useCalculatorStore((s) => s.gridVoltageV);
  const layout3d = useCalculatorStore((s) => s.layout3d);
  const isHybrid = calculationResult.systemType === 'hybrid' && calculationResult.battery.hasBattery;

  // Merge calibrated baseline coordinates with any user-dragged baseline overrides
  const nodePositions = useMemo<Record<DiagramNodeKey, [number, number, number]>>(() => {
    return {
      ...DEFAULT_BASE_NODE_POSITIONS,
      ...(layout3d.baseNodePositions as Partial<Record<DiagramNodeKey, [number, number, number]>>),
    };
  }, [layout3d.baseNodePositions]);

  const removedBaseSet = useMemo(
    () => new Set(layout3d.removedBaseNodes || []),
    [layout3d.removedBaseNodes]
  );

  const theme = useCalculatorStore((s) => s.theme);
  const isDark = theme === 'dark';

  return (
    <>
      {/* Studio Lighting */}
      <color attach="background" args={[isDark ? '#0F172A' : '#F1F5F9']} />
      <ambientLight intensity={isDark ? 0.95 : 1.25} />
      <directionalLight
        position={[14, 24, 18]}
        intensity={isDark ? 1.8 : 1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={12}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.5}
        shadow-camera-far={68}
        shadow-bias={-0.0001}
      />
      {/* Soft Sky Fill Light */}
      <directionalLight position={[-18, 14, 10]} intensity={isDark ? 0.65 : 0.75} color="#BAE6FD" />
      {/* Studio Rim Light for metallic specular glints */}
      <directionalLight position={[0, 18, -12]} intensity={isDark ? 0.75 : 0.55} color="#FEF08A" />

      {/* Expanded Commercial Architectural Wall Backboard & Floor Structure */}
      <ArchitecturalWallBackboard isDark={isDark} />

      {/* Floor & Wall Contact Shadows */}
      <ContactShadows
        position={[0.7, 0.002, 7.0]}
        opacity={isDark ? 0.6 : 0.38}
        scale={44}
        blur={1.8}
        far={7}
        resolution={1024}
        color={isDark ? '#020617' : '#334155'}
      />
      <ContactShadows
        position={[0.7, 3.6, -0.08]}
        rotation={[Math.PI / 2, 0, 0]}
        opacity={isDark ? 0.5 : 0.28}
        scale={[36, 6.6]}
        blur={1.5}
        far={2.5}
        resolution={1024}
        color={isDark ? '#020617' : '#334155'}
      />

      {/* Expanded Architectural Floor Grid atop Concrete Slab */}
      <Grid
        position={[PLANT_ROOM_GEOMETRY.centerX, 0.004, PLANT_ROOM_GEOMETRY.floor.centerZ]}
        args={[PLANT_ROOM_GEOMETRY.floor.width, PLANT_ROOM_GEOMETRY.floor.depth]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor={isDark ? '#334155' : '#CBD5E1'}
        sectionSize={2}
        sectionThickness={0.9}
        sectionColor={isDark ? '#475569' : '#94A3B8'}
        fadeDistance={52}
        fadeStrength={1.2}
      />

      {/* Baseline DC Generation & Point-of-Entry Sequence */}
      {!removedBaseSet.has('pv_array') && (
        <DiagramNodeMesh
          nodeKey="pv_array"
          label="PV ARRAY"
          sublabel={`${calculationResult.summary.totalPanels}x Modules`}
          position={nodePositions.pv_array}
          color="#0284C7"
          nodeType="pv"
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      )}
      {!removedBaseSet.has('dc_isolator') && (
        <DiagramNodeMesh
          nodeKey="dc_isolator"
          label="DC ISOLATOR"
          sublabel={`${calculationResult.dc.isolatorRatingA}A`}
          position={nodePositions.dc_isolator}
          color="#D97706"
          nodeType="isolator"
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      )}
      {!removedBaseSet.has('dc_breaker') && (
        <DiagramNodeMesh
          nodeKey="dc_breaker"
          label="DC BREAKER"
          sublabel={`${calculationResult.dc.breakerRatingA}A`}
          position={nodePositions.dc_breaker}
          color="#DC2626"
          nodeType="breaker"
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      )}
      {!removedBaseSet.has('dc_spd') && (
        <DiagramNodeMesh
          nodeKey="dc_spd"
          label="DC SPD"
          sublabel={calculationResult.dc.spdRating}
          position={nodePositions.dc_spd}
          color="#059669"
          nodeType="spd"
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      )}

      {/* Central Solar Inverter */}
      {!removedBaseSet.has('inverter') && (
        <DiagramNodeMesh
          nodeKey="inverter"
          label="SOLAR INVERTER"
          sublabel={`${calculationResult.summary.inverterPowerKw} kW ${calculationResult.systemType.toUpperCase()}`}
          position={nodePositions.inverter}
          color="#D97706"
          nodeType="inverter"
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      )}

      {/* Hybrid Battery Storage System */}
      {isHybrid && (
        <>
          {!removedBaseSet.has('battery_breaker') && (
            <DiagramNodeMesh
              nodeKey="battery_breaker"
              label="BATTERY MCCB"
              sublabel={`${calculationResult.battery.recommendedBreakerA}A`}
              position={nodePositions.battery_breaker}
              color="#059669"
              nodeType="breaker"
              onLockControls={handleLockControls}
              onWireStart={handleWireStart}
            />
          )}
          {!removedBaseSet.has('battery') && (
            <DiagramNodeMesh
              nodeKey="battery"
              label="BATTERY STORAGE"
              sublabel={`${(calculationResult.battery.totalEnergyWh / 1000).toFixed(1)} kWh`}
              position={nodePositions.battery}
              color="#059669"
              nodeType="battery"
              onLockControls={handleLockControls}
              onWireStart={handleWireStart}
            />
          )}
        </>
      )}

      {/* AC Distribution Nodes */}
      {!removedBaseSet.has('ac_breaker') && (
        <DiagramNodeMesh
          nodeKey="ac_breaker"
          label="AC BREAKER"
          sublabel={`${calculationResult.ac.breakerRatingA}A`}
          position={nodePositions.ac_breaker}
          color="#0284C7"
          nodeType="breaker"
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      )}
      {!removedBaseSet.has('ac_spd') && (
        <DiagramNodeMesh
          nodeKey="ac_spd"
          label="AC SPD"
          sublabel={calculationResult.ac.spdRating}
          position={nodePositions.ac_spd}
          color="#059669"
          nodeType="spd"
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      )}
      {!removedBaseSet.has('ac_isolator') && (
        <DiagramNodeMesh
          nodeKey="ac_isolator"
          label="AC ISOLATOR"
          sublabel={`${calculationResult.ac.isolatorRatingA}A`}
          position={nodePositions.ac_isolator}
          color="#D97706"
          nodeType="isolator"
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      )}
      {!removedBaseSet.has('main_panel') && (
        <DiagramNodeMesh
          nodeKey="main_panel"
          label="MAIN SERVICE PANEL"
          sublabel="Distribution"
          position={nodePositions.main_panel}
          color="#475569"
          nodeType="panel"
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      )}
      {!removedBaseSet.has('ats') && (
        <DiagramNodeMesh
          nodeKey="ats"
          label="AUTOMATIC TRANSFER SWITCH"
          sublabel={calculationResult.ac.atsConfigured ? `${calculationResult.ac.atsRatingA}A` : 'BYPASS'}
          position={nodePositions.ats}
          color="#7C3AED"
          nodeType="ats"
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      )}
      {!removedBaseSet.has('grid') && (
        <DiagramNodeMesh
          nodeKey="grid"
          label="UTILITY GRID"
          sublabel={`${gridVoltageV}V AC`}
          position={nodePositions.grid}
          color="#64748B"
          nodeType="grid"
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      )}
      {!removedBaseSet.has('load') && (
        <DiagramNodeMesh
          nodeKey="load"
          label="BUILDING LOAD"
          sublabel="Consumer Circuit"
          position={nodePositions.load}
          color="#0284C7"
          nodeType="load"
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      )}
      {!removedBaseSet.has('grounding') && (
        <DiagramNodeMesh
          nodeKey="grounding"
          label="COPPER GROUND BUSBAR"
          sublabel="UL 467 / NEC 250"
          position={nodePositions.grounding}
          color="#D97706"
          nodeType="grounding"
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      )}

      {/* User-Added Custom 3D Switchgear, Batteries, Inverters, Panels & PV Arrays */}
      {layout3d.placedComponents.map((item) => (
        <PlacedComponentMesh
          key={item.id}
          item={item}
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      ))}

      {/* Positive (+) Red & Negative (-) Dark Gray Port-to-Port Wiring + Magnetic Terminal Snapping */}
      <CustomWireSystem
        nodePositions={nodePositions}
        isHybrid={isHybrid}
        isDark={isDark}
        isAnimationPaused={isAnimationPaused}
        onLockControls={handleLockControls}
        wireStartTriggerRef={wireStartTriggerRef}
      />

      {/* Calibrated Commercial Plant Room OrbitControls */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0.6, 2.5, 0.5]}
        enableDamping
        dampingFactor={0.08}
        minDistance={4.5}
        maxDistance={68}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minPolarAngle={0.08}
      />
    </>
  );
}
