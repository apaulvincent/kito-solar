// src/components/diagram/PowerFlowCables.tsx
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CableConnection, DiagramNodeKey } from '@/types/diagram';
import { WirePolarity } from '@/types/layout3d';
import { useCalculatorStore } from '@/store/useCalculatorStore';

interface PowerFlowCablesProps {
  cables: CableConnection[];
  nodePositions: Record<DiagramNodeKey, [number, number, number]>;
  isAnimationPaused?: boolean;
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);

// Parallel (+/-) conductor lane offsets so Red (+) and Dark Gray (-) wires run neatly side-by-side
const POSITIVE_LANE_OFFSET: [number, number, number] = [-0.045, 0.045, 0.025];
const NEGATIVE_LANE_OFFSET: [number, number, number] = [0.045, -0.045, -0.005];

interface ConductorPairPathData {
  id: string;
  cableId: string;
  polarity: WirePolarity;
  type: string;
  waypoints: [number, number, number][];
  totalDistance: number;
  segments: {
    pStart: [number, number, number];
    pEnd: [number, number, number];
    length: number;
    cumStart: number;
    cumEnd: number;
  }[];
}

interface ParticleInstance {
  pathIndex: number;
  phase: number;
  polarity: WirePolarity;
  isCableActive: boolean;
}

function isConduitFlowing(cableId: string, atsSource: 'solar' | 'utility'): boolean {
  if (atsSource === 'solar') {
    if (cableId === 'c-grid-panel') return false;
    return true;
  } else {
    const inverterAcRoutes = ['c-inv-acbrk', 'c-acbrk-spd', 'c-acbrk-iso', 'c-iso-panel'];
    if (inverterAcRoutes.includes(cableId)) return false;
    return true;
  }
}

function buildOffsetSegments(
  baseWaypoints: [number, number, number][],
  offset: [number, number, number]
): {
  waypoints: [number, number, number][];
  totalDistance: number;
  segments: ConductorPairPathData['segments'];
} {
  const waypoints: [number, number, number][] = baseWaypoints.map((pt) => [
    Number((pt[0] + offset[0]).toFixed(3)),
    Number((pt[1] + offset[1]).toFixed(3)),
    Number((pt[2] + offset[2]).toFixed(3)),
  ]);

  let cumDist = 0;
  const segments: ConductorPairPathData['segments'] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dz = p2[2] - p1[2];
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (length > 0.0005) {
      segments.push({
        pStart: p1,
        pEnd: p2,
        length,
        cumStart: cumDist,
        cumEnd: cumDist + length,
      });
      cumDist += length;
    }
  }

  return {
    waypoints,
    totalDistance: Math.max(cumDist, 0.0001),
    segments,
  };
}

export function PowerFlowCables({
  cables,
  nodePositions,
  isAnimationPaused = false,
}: PowerFlowCablesProps) {
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const hoveredNodeKey = useCalculatorStore((s) => s.hoveredNodeKey);
  const atsSource = useCalculatorStore((s) => s.atsSource);

  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const hasInitializedRef = useRef(false);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Expand each route into a parallel Positive (+) Red and Negative (-) Dark Gray conductor pair
  const pairPaths = useMemo<ConductorPairPathData[]>(() => {
    const result: ConductorPairPathData[] = [];

    for (const cable of cables) {
      const rawWaypoints =
        cable.waypoints && cable.waypoints.length >= 2
          ? cable.waypoints
          : [nodePositions[cable.from], nodePositions[cable.to]];

      const baseWaypoints = rawWaypoints.filter(Boolean) as [number, number, number][];
      if (baseWaypoints.length < 2) continue;

      const posData = buildOffsetSegments(baseWaypoints, POSITIVE_LANE_OFFSET);
      const negData = buildOffsetSegments(baseWaypoints, NEGATIVE_LANE_OFFSET);

      result.push(
        {
          id: `${cable.id}-pos`,
          cableId: cable.id,
          polarity: 'positive',
          type: cable.type,
          ...posData,
        },
        {
          id: `${cable.id}-neg`,
          cableId: cable.id,
          polarity: 'negative',
          type: cable.type,
          ...negData,
        }
      );
    }

    return result;
  }, [cables, nodePositions]);

  // Generate particle slots along both (+) and (-) conductors
  const particles = useMemo<ParticleInstance[]>(() => {
    const list: ParticleInstance[] = [];

    pairPaths.forEach((path, pathIndex) => {
      if (path.segments.length === 0 || path.totalDistance <= 0.001) return;
      if (!isConduitFlowing(path.cableId, atsSource)) return;

      const cable = cables.find((c) => c.id === path.cableId);
      const isCableActive = Boolean(
        cable &&
          (selectedNodeKey === cable.from ||
            selectedNodeKey === cable.to ||
            hoveredNodeKey === cable.from ||
            hoveredNodeKey === cable.to)
      );

      const count = Math.max(2, Math.min(7, Math.round(path.totalDistance * 1.25)));

      for (let p = 0; p < count; p++) {
        list.push({
          pathIndex,
          phase: p / count,
          polarity: path.polarity,
          isCableActive,
        });
      }
    });

    return list;
  }, [pairPaths, cables, selectedNodeKey, hoveredNodeKey, atsSource]);

  // Color particles: bright Red/Amber on Positive (+), luminous Cool Gray/Cyan on Negative (-)
  useEffect(() => {
    if (!instancedMeshRef.current || particles.length === 0) return;
    const tempColor = new THREE.Color();

    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      const hex = pt.polarity === 'positive' ? '#FB7185' : '#94A3B8';
      tempColor.set(hex);
      instancedMeshRef.current.setColorAt(i, tempColor);
    }

    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [particles, atsSource]);

  // Animate particles: Positive (+) flows forward (0 -> 1), Negative (-) flows in reverse (1 -> 0)
  useFrame((state) => {
    if (!instancedMeshRef.current || particles.length === 0) return;
    if (isAnimationPaused && hasInitializedRef.current) return;

    const t = isAnimationPaused ? 0 : state.clock.getElapsedTime();

    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      const path = pairPaths[pt.pathIndex];
      if (!path || path.segments.length === 0 || path.totalDistance <= 0.001) continue;

      const speed = 0.8;
      const rawProgress = (pt.phase + (t * speed) / path.totalDistance) % 1.0;
      // Negative (-) particles travel in reverse from load back to source
      const progress =
        pt.polarity === 'negative' ? (1.0 - rawProgress + 1.0) % 1.0 : rawProgress;
      const targetDist = progress * path.totalDistance;

      let activeSeg = path.segments[0];
      for (let s = 0; s < path.segments.length; s++) {
        const seg = path.segments[s];
        if (targetDist >= seg.cumStart && targetDist <= seg.cumEnd) {
          activeSeg = seg;
          break;
        }
      }

      const segLen = activeSeg.length;
      const u = segLen > 0 ? (targetDist - activeSeg.cumStart) / segLen : 0;
      const clampedU = Math.max(0, Math.min(1, u));

      const x = activeSeg.pStart[0] + clampedU * (activeSeg.pEnd[0] - activeSeg.pStart[0]);
      const y = activeSeg.pStart[1] + clampedU * (activeSeg.pEnd[1] - activeSeg.pStart[1]);
      const z = activeSeg.pStart[2] + clampedU * (activeSeg.pEnd[2] - activeSeg.pStart[2]);

      dummy.position.set(x, y, z + 0.032);

      const baseScale = pt.isCableActive ? 1.25 : 1.0;
      const pulse = 1.0 + 0.12 * Math.sin(t * 5 + i);
      dummy.scale.setScalar(baseScale * pulse);

      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    hasInitializedRef.current = true;
  });

  return (
    <group>
      {/* Parallel Positive (+) Red and Negative (-) Dark Gray Wire Pairs */}
      {pairPaths.map((path) => {
        const cable = cables.find((c) => c.id === path.cableId);
        if (!cable || path.segments.length === 0) return null;

        const isCableActive =
          selectedNodeKey === cable.from ||
          selectedNodeKey === cable.to ||
          hoveredNodeKey === cable.from ||
          hoveredNodeKey === cable.to;

        const isPos = path.polarity === 'positive';
        // Positive (+) = Solar Red; Negative (-) = Visible Dark Gray (#64748B / #52525B)
        const wireColor = isPos
          ? isCableActive
            ? '#EF4444'
            : '#DC2626'
          : isCableActive
          ? '#94A3B8'
          : '#64748B';

        const emissiveColor = isPos ? '#991B1B' : '#334155';
        const emissiveIntensity = isCableActive ? 0.5 : 0.28;
        const radius = isCableActive ? 0.035 : 0.026;

        return (
          <group key={path.id}>
            {/* Insulated Conductor Cylinders */}
            {path.segments.map((seg, sIdx) => {
              const start = new THREE.Vector3(...seg.pStart);
              const end = new THREE.Vector3(...seg.pEnd);
              const dir = new THREE.Vector3().subVectors(end, start);
              const dist = dir.length();
              if (dist <= 0.001) return null;

              const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
              const quaternion = new THREE.Quaternion().setFromUnitVectors(
                Y_AXIS,
                dir.clone().normalize()
              );

              return (
                <group key={`seg-${sIdx}`} position={midpoint} quaternion={quaternion}>
                  <mesh castShadow receiveShadow>
                    <cylinderGeometry args={[radius, radius, dist, 14]} />
                    <meshStandardMaterial
                      color={wireColor}
                      metalness={0.28}
                      roughness={0.34}
                      emissive={emissiveColor}
                      emissiveIntensity={emissiveIntensity}
                    />
                  </mesh>
                </group>
              );
            })}

            {/* Molded 90-Degree Cable Bend Elbows */}
            {path.waypoints.slice(1, -1).map((wpt, cIdx) => (
              <mesh key={`elbow-${cIdx}`} position={wpt} castShadow>
                <sphereGeometry args={[radius * 1.12, 10, 10]} />
                <meshStandardMaterial
                  color={wireColor}
                  metalness={0.28}
                  roughness={0.34}
                  emissive={emissiveColor}
                  emissiveIntensity={emissiveIntensity}
                />
              </mesh>
            ))}

            {/* Metallic Crimp Lug Boots at Terminations */}
            {[path.waypoints[0], path.waypoints[path.waypoints.length - 1]].map(
              (termWpt, termIdx) => (
                <mesh key={`term-${termIdx}`} position={termWpt}>
                  <cylinderGeometry args={[radius * 1.35, radius * 1.35, 0.04, 10]} />
                  <meshStandardMaterial
                    color={isPos ? '#FCA5A5' : '#CBD5E1'}
                    metalness={0.85}
                    roughness={0.22}
                  />
                </mesh>
              )
            )}
          </group>
        );
      })}

      {/* Animated Bidirectional Current Pulses (+ Forward, - Reverse) */}
      {particles.length > 0 && (
        <instancedMesh
          key={`particles-${particles.length}-${atsSource}`}
          ref={instancedMeshRef}
          args={[undefined, undefined, particles.length]}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.048, 12, 12]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      )}
    </group>
  );
}
