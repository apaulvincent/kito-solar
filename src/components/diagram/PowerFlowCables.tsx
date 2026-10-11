// src/components/diagram/PowerFlowCables.tsx
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { CableConnection, DiagramNodeKey } from '@/types/diagram';
import { useCalculatorStore } from '@/store/useCalculatorStore';

interface PowerFlowCablesProps {
  cables: CableConnection[];
  nodePositions: Record<DiagramNodeKey, [number, number, number]>;
  isAnimationPaused?: boolean;
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);

interface RoutePathData {
  cableId: string;
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
  type: string;
  isCableActive: boolean;
}

export function PowerFlowCables({
  cables,
  nodePositions,
  isAnimationPaused = false,
}: PowerFlowCablesProps) {
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const hoveredNodeKey = useCalculatorStore((s) => s.hoveredNodeKey);

  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const hasInitializedRef = useRef(false);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Compute waypoint segments and cumulative distances for each conduit route
  const paths = useMemo<RoutePathData[]>(() => {
    return cables.map((cable) => {
      const rawWaypoints =
        cable.waypoints && cable.waypoints.length >= 2
          ? cable.waypoints
          : [nodePositions[cable.from], nodePositions[cable.to]];

      const waypoints = rawWaypoints.filter(Boolean) as [number, number, number][];
      if (waypoints.length < 2) {
        return {
          cableId: cable.id,
          type: cable.type,
          waypoints: [],
          totalDistance: 0,
          segments: [],
        };
      }

      let cumDist = 0;
      const segments = [];
      for (let i = 0; i < waypoints.length - 1; i++) {
        const p1 = waypoints[i];
        const p2 = waypoints[i + 1];
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const dz = p2[2] - p1[2];
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        segments.push({
          pStart: p1,
          pEnd: p2,
          length,
          cumStart: cumDist,
          cumEnd: cumDist + length,
        });
        cumDist += length;
      }

      return {
        cableId: cable.id,
        type: cable.type,
        waypoints,
        totalDistance: Math.max(cumDist, 0.0001),
        segments,
      };
    });
  }, [cables, nodePositions]);

  // Generate particle slots along routes with density proportional to distance
  const particles = useMemo<ParticleInstance[]>(() => {
    const list: ParticleInstance[] = [];

    paths.forEach((path, r) => {
      if (path.segments.length === 0 || path.totalDistance <= 0.001) return;
      const cable = cables.find((c) => c.id === path.cableId);
      const isCableActive = Boolean(
        cable &&
          (selectedNodeKey === cable.from ||
            selectedNodeKey === cable.to ||
            hoveredNodeKey === cable.from ||
            hoveredNodeKey === cable.to)
      );

      // Spacing: roughly 1 bead per 0.65m of conduit, clamped between 2 and 8 beads
      const count = Math.max(2, Math.min(8, Math.round(path.totalDistance * 1.5)));

      for (let p = 0; p < count; p++) {
        list.push({
          pathIndex: r,
          phase: p / count,
          type: path.type,
          isCableActive,
        });
      }
    });

    return list;
  }, [paths, cables, selectedNodeKey, hoveredNodeKey]);

  // Color each instance bead according to current circuit type
  useEffect(() => {
    if (!instancedMeshRef.current || particles.length === 0) return;
    const tempColor = new THREE.Color();

    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      const hex =
        pt.type === 'dc'
          ? '#F59E0B' // Solar Amber / Gold
          : pt.type === 'battery'
          ? '#10B981' // Battery Emerald Green
          : pt.type === 'ground'
          ? '#059669' // Ground Forest Green
          : '#0284C7'; // AC Grid / Load Electric Blue

      tempColor.set(hex);
      instancedMeshRef.current.setColorAt(i, tempColor);
    }

    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [particles]);

  // Update bead positions and pulsing scale along conduit pathways
  useFrame((state) => {
    if (!instancedMeshRef.current || particles.length === 0) return;
    if (isAnimationPaused && hasInitializedRef.current) return;

    const t = isAnimationPaused ? 0 : state.clock.getElapsedTime();

    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      const path = paths[pt.pathIndex];
      if (!path || path.segments.length === 0 || path.totalDistance <= 0.001) continue;

      const speed = 0.75;
      const progress = (pt.phase + (t * speed) / path.totalDistance) % 1.0;
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

      // Position sphere proudly on the front exterior surface of the conduit pipe
      dummy.position.set(x, y, z + 0.055);

      const baseScale = pt.isCableActive ? 1.3 : 1.0;
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
      {/* Orthogonal EMT Metallic Conduit Runs & Corner Junction Boxes */}
      {paths.map((path) => {
        const cable = cables.find((c) => c.id === path.cableId);
        if (!cable || path.segments.length === 0) return null;

        const isCableActive =
          selectedNodeKey === cable.from ||
          selectedNodeKey === cable.to ||
          hoveredNodeKey === cable.from ||
          hoveredNodeKey === cable.to;

        const activeColor =
          cable.type === 'dc'
            ? '#D97706'
            : cable.type === 'battery'
            ? '#059669'
            : cable.type === 'ground'
            ? '#10B981'
            : '#0284C7';

        const baseEmtColor = '#94A3B8';
        const radius = isCableActive ? 0.065 : 0.045;

        return (
          <group key={path.cableId}>
            {/* Straight EMT Conduit Cylinders between adjacent waypoints */}
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

              // Calculate strap positions along long conduit runs
              const strapTValues: number[] =
                dist >= 2.2 ? [0.3, 0.7] : dist >= 0.75 ? [0.5] : [];

              return (
                <group key={`seg-${sIdx}`}>
                  {/* Main EMT Metallic Conduit Pipe */}
                  <group position={midpoint} quaternion={quaternion}>
                    <mesh castShadow receiveShadow>
                      <cylinderGeometry args={[radius, radius, dist, 20]} />
                      <meshStandardMaterial
                        color={isCableActive ? activeColor : baseEmtColor}
                        metalness={0.88}
                        roughness={0.20}
                        emissive={isCableActive ? activeColor : '#000000'}
                        emissiveIntensity={isCableActive ? 0.45 : 0}
                      />
                    </mesh>
                  </group>

                  {/* 2-Hole Galvanized Steel Conduit Straps anchoring to wall */}
                  {strapTValues.map((tVal, stIdx) => {
                    const strapPos = new THREE.Vector3().lerpVectors(start, end, tVal);
                    return (
                      <group
                        key={`strap-${sIdx}-${stIdx}`}
                        position={strapPos}
                        quaternion={quaternion}
                      >
                        {/* Curved Strap Saddle over Pipe */}
                        <mesh position={[0, 0, 0]}>
                          <cylinderGeometry args={[radius + 0.012, radius + 0.012, 0.045, 16]} />
                          <meshStandardMaterial
                            color="#64748B"
                            metalness={0.85}
                            roughness={0.25}
                          />
                        </mesh>
                        {/* 2-Hole Mounting Base Plate */}
                        <mesh position={[0, 0, -0.015]}>
                          <boxGeometry args={[radius * 2 + 0.08, 0.04, 0.012]} />
                          <meshStandardMaterial
                            color="#475569"
                            metalness={0.85}
                            roughness={0.25}
                          />
                        </mesh>
                        {/* Left & Right Mounting Lag Screws */}
                        <mesh position={[-(radius + 0.03), 0, -0.01]}>
                          <cylinderGeometry args={[0.008, 0.008, 0.015, 8]} />
                          <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
                        </mesh>
                        <mesh position={[radius + 0.03, 0, -0.01]}>
                          <cylinderGeometry args={[0.008, 0.008, 0.015, 8]} />
                          <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
                        </mesh>
                      </group>
                    );
                  })}
                </group>
              );
            })}

            {/* Cast Aluminum 90-Degree Conduit Bodies (LB / LL Fittings) at Intermediate Corners */}
            {path.waypoints.slice(1, -1).map((wpt, cIdx) => (
              <group key={`corner-${cIdx}`} position={wpt}>
                {/* Cast Aluminum Rounded Enclosure Body */}
                <RoundedBox
                  args={[0.13, 0.13, 0.13]}
                  radius={0.02}
                  smoothness={4}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial
                    color={isCableActive ? activeColor : '#64748B'}
                    metalness={0.85}
                    roughness={0.25}
                    emissive={isCableActive ? activeColor : '#000000'}
                    emissiveIntensity={isCableActive ? 0.35 : 0}
                  />
                </RoundedBox>
                {/* Gasketed Access Cover Plate */}
                <mesh position={[0, 0, 0.068]}>
                  <boxGeometry args={[0.09, 0.09, 0.01]} />
                  <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.7} />
                </mesh>
                {/* 2x Stainless Cover Screws */}
                <mesh position={[0, 0.032, 0.075]}>
                  <cylinderGeometry args={[0.008, 0.008, 0.006, 8]} />
                  <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
                </mesh>
                <mesh position={[0, -0.032, 0.075]}>
                  <cylinderGeometry args={[0.008, 0.008, 0.006, 8]} />
                  <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
                </mesh>
              </group>
            ))}

            {/* Threaded Compression Connector Hubs at Conduit Terminations */}
            {[path.waypoints[0], path.waypoints[path.waypoints.length - 1]].map(
              (termWpt, termIdx) => (
                <group key={`term-${termIdx}`} position={termWpt}>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[radius + 0.02, radius + 0.02, 0.04, 6]} />
                    <meshStandardMaterial
                      color="#94A3B8"
                      metalness={0.88}
                      roughness={0.22}
                    />
                  </mesh>
                </group>
              )
            )}
          </group>
        );
      })}

      {/* Animated Electric Current Energy Flow Pulses (Instanced Luminous Spheres) */}
      {particles.length > 0 && (
        <instancedMesh
          ref={instancedMeshRef}
          args={[undefined, undefined, particles.length]}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      )}
    </group>
  );
}
