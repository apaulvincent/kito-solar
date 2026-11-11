import { useMemo, useRef, useEffect, useCallback } from 'react';
import { OrbitControls, Grid, ContactShadows } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { DiagramNodeKey } from '@/types/diagram';
import { PLANT_ROOM_GEOMETRY } from '@/types/layout3d';
import { DEFAULT_BASE_NODE_POSITIONS } from '@/lib/layout3dEngine';
import { BASE_SCENE_NODES } from '@/lib/diagramNodeSpecs';
import { DiagramNodeMesh } from './DiagramNodeMesh';
import { PlacedComponentMesh } from './PlacedComponentMesh';
import { CustomWireSystem } from './CustomWireSystem';

interface SolarSceneProps {
  isAnimationPaused?: boolean;
  resetViewCount?: number;
}

const STANDOFF_XS = [-16.4, -10.8, -5.2, 0.7, 6.6, 12.2, 17.8];
const UNISTRUT_HOLE_XS = Array.from({ length: 23 }, (_, i) => -16.5 + i * 1.5);

function ArchitecturalWallBackboard({ isDark }: { isDark: boolean }) {
  const { centerX, wall, backboard, floor } = PLANT_ROOM_GEOMETRY;
  const standoffPositions: [number, number][] = [];
  for (const sx of STANDOFF_XS) {
    standoffPositions.push([sx, 6.6], [sx, 0.6]);
  }

  return (
    <group>
      <mesh position={[centerX, wall.height / 2 - 0.06, wall.z]} receiveShadow>
        <boxGeometry args={[wall.width, wall.height, wall.thickness]} />
        <meshStandardMaterial
          color={isDark ? '#0F172A' : '#E2E8F0'}
          roughness={0.88}
          metalness={0.08}
        />
      </mesh>

      <mesh position={[centerX, 0.08, -0.14]} receiveShadow>
        <boxGeometry args={[wall.width, 0.16, 0.04]} />
        <meshStandardMaterial
          color={isDark ? '#1E293B' : '#CBD5E1'}
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      <mesh position={[centerX, backboard.centerY, -0.12]} receiveShadow>
        <boxGeometry args={[backboard.width, backboard.height, 0.06]} />
        <meshStandardMaterial
          color={isDark ? '#1E293B' : '#F8FAFC'}
          roughness={0.45}
          metalness={0.15}
        />
      </mesh>

      <mesh position={[centerX, backboard.centerY, -0.09]}>
        <boxGeometry args={[backboard.width + 0.06, backboard.height + 0.06, 0.01]} />
        <meshStandardMaterial
          color={isDark ? '#334155' : '#E2E8F0'}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

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
  const controlsRef = useRef<OrbitControlsImpl>(null);
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
  const layout3d = useCalculatorStore((s) => s.layout3d);
  const isHybrid = calculationResult.systemType === 'hybrid' && calculationResult.battery.hasBattery;

  const nodePositions = useMemo<Record<DiagramNodeKey, [number, number, number]>>(
    () => ({
      ...DEFAULT_BASE_NODE_POSITIONS,
      ...(layout3d.baseNodePositions as Partial<Record<DiagramNodeKey, [number, number, number]>>),
    }),
    [layout3d.baseNodePositions]
  );

  const removedBaseSet = useMemo(
    () => new Set(layout3d.removedBaseNodes || []),
    [layout3d.removedBaseNodes]
  );

  const theme = useCalculatorStore((s) => s.theme);
  const isDark = theme === 'dark';

  const activeBaseNodes = useMemo(
    () =>
      BASE_SCENE_NODES.filter(
        (spec) => (!spec.hybridOnly || isHybrid) && !removedBaseSet.has(spec.key)
      ),
    [isHybrid, removedBaseSet]
  );

  return (
    <>
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
      <directionalLight position={[-18, 14, 10]} intensity={isDark ? 0.65 : 0.75} color="#BAE6FD" />
      <directionalLight position={[0, 18, -12]} intensity={isDark ? 0.75 : 0.55} color="#FEF08A" />

      <ArchitecturalWallBackboard isDark={isDark} />

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

      {activeBaseNodes.map((spec) => (
        <DiagramNodeMesh
          key={spec.key}
          nodeKey={spec.key}
          position={nodePositions[spec.key]}
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      ))}

      {layout3d.placedComponents.map((item) => (
        <PlacedComponentMesh
          key={item.id}
          item={item}
          onLockControls={handleLockControls}
          onWireStart={handleWireStart}
        />
      ))}

      <CustomWireSystem
        nodePositions={nodePositions}
        isHybrid={isHybrid}
        isDark={isDark}
        isAnimationPaused={isAnimationPaused}
        onLockControls={handleLockControls}
        wireStartTriggerRef={wireStartTriggerRef}
      />

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
