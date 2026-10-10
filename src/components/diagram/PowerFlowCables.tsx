// src/components/diagram/PowerFlowCables.tsx
import { useRef, useMemo } from 'react';
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
const PARTICLES_PER_ROUTE = 8;

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

export function PowerFlowCables({
  cables,
  nodePositions,
  isAnimationPaused = false,
}: PowerFlowCablesProps) {
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const hoveredNodeKey = useCalculatorStore((s) => s.hoveredNodeKey);

  const particlesRef = useRef<THREE.Points>(null);

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

  // Piecewise particle animation navigating along multi-segment conduits and 90-degree corners
  useFrame((state) => {
    if (isAnimationPaused || !particlesRef.current) return;
    const t = state.clock.getElapsedTime();
    const geo = particlesRef.current.geometry;
    const pos = geo.attributes.position;
    if (!pos) return;

    let particleIdx = 0;

    for (let r = 0; r < paths.length; r++) {
      const path = paths[r];
      if (path.segments.length === 0 || path.totalDistance <= 0.001) continue;

      for (let p = 0; p < PARTICLES_PER_ROUTE; p++) {
        const arrayIdx = particleIdx * 3;
        particleIdx++;
        if (arrayIdx + 2 >= pos.array.length) break;

        const phase = p / PARTICLES_PER_ROUTE;
        const progress = (phase + t * 0.32) % 1.0;
        const targetDist = progress * path.totalDistance;

        // Find active waypoint segment
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

        pos.array[arrayIdx] = activeSeg.pStart[0] + clampedU * (activeSeg.pEnd[0] - activeSeg.pStart[0]);
        pos.array[arrayIdx + 1] = activeSeg.pStart[1] + clampedU * (activeSeg.pEnd[1] - activeSeg.pStart[1]);
        pos.array[arrayIdx + 2] = activeSeg.pStart[2] + clampedU * (activeSeg.pEnd[2] - activeSeg.pStart[2]);
      }
    }

    pos.needsUpdate = true;
  });

  const particleCount = useMemo(() => paths.length * PARTICLES_PER_ROUTE, [paths.length]);
  const particlePositions = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);

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

      {/* Animated Electric Current Energy Flow Particles */}
      <points key={particleCount} ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          color="#F59E0B"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
