// src/features/solar-mapper/components/Roof3DPreviewCanvas.tsx
import React, { useMemo, useState, useRef, Suspense } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sun,
  Map,
  Compass,
  RotateCcw,
  Sliders,
  Layers,
  Sparkles,
  Maximize2,
  Anchor,
  Move,
  Minus,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import {
  calculateCentroid,
  projectSinglePointToMeters,
} from '../utils/geodesicMath';
import { GeoPoint, RoofPolygonSection } from '../types/solarMapper';

const BUILDING_EAVE_HEIGHT = 2.4; // 2.4m residential wall height

/**
 * Calculates the 3D position of the Sun along its celestial transit.
 * East (+X) at 6:00 AM -> Noon South (+Z peak height) -> West (-X) at 6:00 PM.
 */
function getSunPosition(hour: number, radius = 24): THREE.Vector3 {
  const progress = (hour - 6) / 12; // 0 (6 AM) to 1 (6 PM)
  const angle = progress * Math.PI; // 0 to PI

  // Travel from East (+X) to West (-X)
  const x = Math.cos(angle) * radius;
  // Elevation above horizon (high noon peak)
  const y = Math.max(1.5, Math.sin(angle) * radius * 0.95);
  // Southern declination in Northern Hemisphere tropics
  const z = Math.sin(angle) * (radius * 0.4);

  return new THREE.Vector3(x, y, z);
}

// Format time for 3D label
function formatSunTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

// 2D Rotation Helper
function rotate2D(x: number, y: number, angleRad: number): { x: number; y: number } {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

// Single 3D Roof Component with Side-Axis Rotation & Move Handles
const Roof3DMesh: React.FC<{
  section: RoofPolygonSection;
  siteCenter: GeoPoint;
  isActive: boolean;
  activeTool: 'inspect' | 'move' | 'hinge';
  onSelect: () => void;
  onSetPivotEdge: (edgeIdx: number) => void;
  onStartMoveDrag: (e: ThreeEvent<PointerEvent>) => void;
}> = ({
  section,
  siteCenter,
  isActive,
  activeTool,
  onSelect,
  onSetPivotEdge,
  onStartMoveDrag,
}) => {
  const secCentroid = useMemo(
    () => calculateCentroid(section.vertices),
    [section.vertices]
  );

  const N = section.vertices.length;

  // Project vertices to local meters relative to site center (East = +x, North = +y)
  const worldMeters = useMemo(
    () => section.vertices.map((v) => projectSinglePointToMeters(v, siteCenter)),
    [section.vertices, siteCenter]
  );

  const secCentroidMeters = useMemo(
    () => projectSinglePointToMeters(secCentroid, siteCenter),
    [secCentroid, siteCenter]
  );

  // Selected pivot edge index (0 to N - 1)
  const pivotIdx = useMemo(() => {
    if (N < 2) return 0;
    return ((section.pivotEdgeIndex ?? 0) % N + N) % N;
  }, [section.pivotEdgeIndex, N]);

  // Compute Edge Pivot Frame
  // Edge connects vertex pivotIdx to (pivotIdx + 1) % N
  const { pivotMidpoint, edgeAngleRad, canonicalVertices, ySign, edgeLength } = useMemo(() => {
    if (worldMeters.length < 3) {
      return {
        pivotMidpoint: { x: 0, y: 0 },
        edgeAngleRad: 0,
        canonicalVertices: [],
        ySign: 1,
        edgeLength: 0,
      };
    }

    const pA = worldMeters[pivotIdx];
    const pB = worldMeters[(pivotIdx + 1) % N];

    const mid = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };
    const dx = pB.x - pA.x;
    const dy = pB.y - pA.y;
    const len = Math.hypot(dx, dy);
    const alpha = Math.atan2(dy, dx);

    // Rotate vertices relative to mid by -alpha so the pivot edge lies on y = 0
    const rotated = worldMeters.map((v) => {
      const rx = v.x - mid.x;
      const ry = v.y - mid.y;
      return rotate2D(rx, ry, -alpha);
    });

    // Check centroid y sign so interior is always y >= 0
    const cRel = rotate2D(secCentroidMeters.x - mid.x, secCentroidMeters.y - mid.y, -alpha);
    const sign = cRel.y < 0 ? -1 : 1;

    const canonical = rotated.map((v) => ({
      x: v.x,
      y: v.y * sign,
    }));

    return {
      pivotMidpoint: mid,
      edgeAngleRad: alpha,
      canonicalVertices: canonical,
      ySign: sign,
      edgeLength: len,
    };
  }, [worldMeters, pivotIdx, N, secCentroidMeters]);

  // 2D shape in canonical frame
  const shape = useMemo(() => {
    if (canonicalVertices.length < 3) return null;
    const s = new THREE.Shape();
    s.moveTo(canonicalVertices[0].x, canonicalVertices[0].y);
    for (let i = 1; i < canonicalVertices.length; i++) {
      s.lineTo(canonicalVertices[i].x, canonicalVertices[i].y);
    }
    s.closePath();
    return s;
  }, [canonicalVertices]);

  // Roof deck slab extrude settings
  const roofExtrudeSettings = useMemo(
    () => ({
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    }),
    []
  );

  // Placed panels projected into canonical frame
  const canonicalPanels = useMemo(() => {
    if (!section.placedPanels || canonicalVertices.length < 3) return [];
    const cosA = Math.cos(-edgeAngleRad);
    const sinA = Math.sin(-edgeAngleRad);

    return section.placedPanels.map((panel) => {
      // Panel center relative to siteCenter
      const pWorldX = secCentroidMeters.x + panel.x;
      const pWorldY = secCentroidMeters.y + panel.y;
      const rx = pWorldX - pivotMidpoint.x;
      const ry = pWorldY - pivotMidpoint.y;

      const canX = rx * cosA - ry * sinA;
      const canY = (rx * sinA + ry * cosA) * ySign;

      // Local panel rotation
      const canRot = (panel.rotationDeg || 0) * (Math.PI / 180) - edgeAngleRad;

      return {
        ...panel,
        canonicalX: canX,
        canonicalY: canY,
        canonicalRot: canRot,
      };
    });
  }, [
    section.placedPanels,
    secCentroidMeters,
    pivotMidpoint,
    edgeAngleRad,
    ySign,
    canonicalVertices,
  ]);

  if (!shape) return null;

  // In Three.js: World +X = East, World +Z = South, World -Z = North
  // Pivot point in Three.js world space:
  const anchorX = pivotMidpoint.x;
  const anchorY = BUILDING_EAVE_HEIGHT;
  const anchorZ = -pivotMidpoint.y;

  // Pitch rotation: when pitchDeg is 0°, roof is flat. When > 0, pitches upward!
  const pitchRad = THREE.MathUtils.degToRad(section.pitchDeg);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Anchor Group located at the Midpoint of the Pivot Edge (Eave Height) */}
      <group position={[anchorX, anchorY, anchorZ]}>
        {/* Horizontal orientation along the edge vector */}
        <group rotation={[0, edgeAngleRad, 0]}>
          {/* Pitch Rotation along the local X axis (the edge itself!) */}
          <group rotation={[pitchRad, 0, 0]}>
            {/* Lay flat on horizontal plane (canonical +y extends toward -Z) */}
            <group rotation={[-Math.PI / 2, 0, 0]}>
              {/* Roof Deck Slab */}
              <mesh receiveShadow castShadow position={[0, 0, 0]}>
                <extrudeGeometry args={[shape, roofExtrudeSettings]} />
                <meshStandardMaterial
                  color={isActive ? '#293548' : '#1e293b'}
                  roughness={0.45}
                  metalness={0.35}
                />
              </mesh>

              {/* Glowing Outline on Active Roof Section */}
              {isActive && (
                <mesh position={[0, 0, 0.145]}>
                  <extrudeGeometry
                    args={[
                      shape,
                      { depth: 0.01, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.01 },
                    ]}
                  />
                  <meshBasicMaterial color="#f59e0b" transparent opacity={0.35} wireframe />
                </mesh>
              )}

              {/* Photovoltaic Solar Panels Array */}
              {canonicalPanels.map((panel) => {
                const pW = panel.widthM;
                const pL = panel.lengthM;

                return (
                  <group
                    key={panel.id}
                    position={[panel.canonicalX, panel.canonicalY, 0.17]}
                    rotation={[0, 0, panel.canonicalRot]}
                  >
                    {/* Mounting Rails */}
                    <mesh position={[0, -pL * 0.25, -0.015]}>
                      <boxGeometry args={[pW * 0.95, 0.04, 0.025]} />
                      <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, pL * 0.25, -0.015]}>
                      <boxGeometry args={[pW * 0.95, 0.04, 0.025]} />
                      <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
                    </mesh>

                    {/* Dark Blue Anti-reflective Photovoltaic Glass */}
                    <mesh castShadow receiveShadow>
                      <boxGeometry args={[pW, pL, 0.035]} />
                      <meshStandardMaterial
                        color="#0f2b48"
                        roughness={0.15}
                        metalness={0.85}
                      />
                    </mesh>

                    {/* Anodized Aluminum Outer Frame */}
                    <mesh position={[0, 0, -0.002]}>
                      <boxGeometry args={[pW + 0.02, pL + 0.02, 0.03]} />
                      <meshStandardMaterial
                        color="#cbd5e1"
                        roughness={0.25}
                        metalness={0.9}
                      />
                    </mesh>

                    {/* PV Busbar Grid Line Accent */}
                    <mesh position={[0, 0, 0.019]}>
                      <planeGeometry args={[pW * 0.96, pL * 0.96]} />
                      <meshBasicMaterial
                        color="#1d4ed8"
                        transparent
                        opacity={0.4}
                        wireframe
                      />
                    </mesh>
                  </group>
                );
              })}

              {/* 3D Edge Lines & Clickable Rotation Axis Hinge Selectors */}
              {isActive &&
                canonicalVertices.map((vStart, i) => {
                  const vEnd = canonicalVertices[(i + 1) % canonicalVertices.length];
                  const isPivot = i === pivotIdx;
                  const edgeLengthM = Math.hypot(vEnd.x - vStart.x, vEnd.y - vStart.y);

                  const midX = (vStart.x + vEnd.x) / 2;
                  const midY = (vStart.y + vEnd.y) / 2;

                  return (
                    <group key={`edge-${i}`}>
                      {/* Edge Line Segment */}
                      <Line
                        points={[
                          [vStart.x, vStart.y, 0.16],
                          [vEnd.x, vEnd.y, 0.16],
                        ]}
                        color={isPivot ? '#f59e0b' : '#94a3b8'}
                        lineWidth={isPivot ? 4 : 2}
                        transparent
                        opacity={isPivot ? 1.0 : 0.6}
                      />

                      {/* Clickable Hit Cylinder along edge for switching axis */}
                      <mesh
                        position={[midX, midY, 0.16]}
                        rotation={[
                          0,
                          0,
                          Math.atan2(vEnd.y - vStart.y, vEnd.x - vStart.x) + Math.PI / 2,
                        ]}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetPivotEdge(i);
                        }}
                      >
                        <cylinderGeometry args={[0.2, 0.2, edgeLengthM, 8]} />
                        <meshBasicMaterial transparent opacity={0} />
                      </mesh>

                      {/* Active Hinge Visual Accent & 3D Tag */}
                      {isPivot && (
                        <group position={[midX, midY, 0.22]}>
                          <Text
                            fontSize={0.45}
                            color="#fbbf24"
                            anchorX="center"
                            anchorY="middle"
                            position={[0, 0.35, 0]}
                          >
                            {`Hinge Side ${i + 1} (${edgeLengthM.toFixed(1)}m)`}
                          </Text>
                        </group>
                      )}
                    </group>
                  );
                })}

              {/* 3D Planar Move Handle on Roof Centroid */}
              {isActive && (
                <group
                  position={[
                    secCentroidMeters.x - pivotMidpoint.x,
                    (secCentroidMeters.y - pivotMidpoint.y) * ySign,
                    0.25,
                  ]}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onStartMoveDrag(e);
                  }}
                >
                  {/* Outer Move Ring */}
                  <mesh>
                    <ringGeometry args={[0.6, 0.75, 32]} />
                    <meshBasicMaterial
                      color={activeTool === 'move' ? '#38bdf8' : '#f59e0b'}
                      side={THREE.DoubleSide}
                      transparent
                      opacity={0.85}
                    />
                  </mesh>

                  {/* Center Disc */}
                  <mesh>
                    <circleGeometry args={[0.45, 32]} />
                    <meshBasicMaterial
                      color={activeTool === 'move' ? '#0284c7' : '#d97706'}
                      side={THREE.DoubleSide}
                      transparent
                      opacity={0.4}
                    />
                  </mesh>

                  {/* Move Cross Arrows Accent */}
                  <Line
                    points={[
                      [-0.5, 0, 0.01],
                      [0.5, 0, 0.01],
                    ]}
                    color="#ffffff"
                    lineWidth={2}
                  />
                  <Line
                    points={[
                      [0, -0.5, 0.01],
                      [0, 0.5, 0.01],
                    ]}
                    color="#ffffff"
                    lineWidth={2}
                  />

                  {/* Text label */}
                  <Text
                    position={[0, -0.9, 0.05]}
                    fontSize={0.35}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {activeTool === 'move' ? 'Drag to Move' : 'Move Tool'}
                  </Text>
                </group>
              )}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

// Celestial Sun Path Arc Curve in the Sky
const CelestialSunArc: React.FC = () => {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let h = 6.0; h <= 18.0; h += 0.25) {
      const p = getSunPosition(h);
      pts.push([p.x, p.y, p.z]);
    }
    return pts;
  }, []);

  return (
    <Line
      points={points}
      color="#f59e0b"
      lineWidth={2}
      transparent
      opacity={0.45}
    />
  );
};

// Sunlight Guide Ray from Sun to Roof Center
const SunlightRay: React.FC<{ sunPos: THREE.Vector3 }> = ({ sunPos }) => {
  const points: [number, number, number][] = useMemo(
    () => [
      [sunPos.x, sunPos.y, sunPos.z],
      [0, BUILDING_EAVE_HEIGHT + 0.5, 0],
    ],
    [sunPos.x, sunPos.y, sunPos.z]
  );

  return (
    <Line
      points={points}
      color="#fbbf24"
      lineWidth={1.5}
      transparent
      opacity={0.35}
      dashed
      dashSize={0.6}
      gapSize={0.4}
    />
  );
};

// 3D Scene Environment
const SceneContent: React.FC<{
  sunHour: number;
  activeTool: 'inspect' | 'move' | 'hinge';
  onIsDraggingChange: (isDragging: boolean) => void;
}> = ({ sunHour, activeTool, onIsDraggingChange }) => {
  const {
    roofSections,
    activeSectionId,
    setActiveSectionId,
    setRoofSectionPivotEdge,
    translateRoofSection,
    coordinates,
  } = useSolarMapperStore();

  const sunPos = useMemo(() => getSunPosition(sunHour, 24), [sunHour]);

  // Shared geographic center of all roof polygons combined (centers 3D model at 0,0,0)
  const siteCenter = useMemo(() => {
    const allVertices = roofSections.flatMap((s) => s.vertices);
    if (allVertices.length >= 3) {
      return calculateCentroid(allVertices);
    }
    return coordinates;
  }, [roofSections, coordinates]);

  // Warm dawn/dusk lighting vs bright midday sunlight
  const sunLightColor = useMemo(() => {
    if (sunHour < 7.5 || sunHour > 16.5) return '#fed7aa'; // warm sunset/sunrise amber
    if (sunHour < 9.5 || sunHour > 14.5) return '#fef08a'; // golden morning/late afternoon
    return '#ffffff'; // solar noon crisp white
  }, [sunHour]);

  const activeSection =
    roofSections.find((s) => s.id === activeSectionId) || roofSections[0];

  // Dragging state for move tool
  const [isMoving, setIsMoving] = useState(false);
  const dragPlaneRef = useRef<THREE.Mesh>(null);
  const dragStartPointRef = useRef<{ x: number; z: number } | null>(null);

  const handleStartMoveDrag = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsMoving(true);
    onIsDraggingChange(true);
    if (e.point) {
      dragStartPointRef.current = { x: e.point.x, z: e.point.z };
    }
  };

  const handlePointerMoveOnPlane = (e: ThreeEvent<PointerEvent>) => {
    if (!isMoving || !dragStartPointRef.current || !activeSection) return;
    const currentX = e.point.x;
    const currentZ = e.point.z;

    const deltaX = currentX - dragStartPointRef.current.x;
    const deltaZ = currentZ - dragStartPointRef.current.z;

    // Delta in meters: In Three.js, +X is East, +Z is South.
    // In our 2D geodesic coordinates: x = East (+), y = North (+).
    // So deltaMetersX = deltaX, deltaMetersY = -deltaZ.
    if (Math.hypot(deltaX, deltaZ) >= 0.1) {
      translateRoofSection(activeSection.id, deltaX, -deltaZ);
      dragStartPointRef.current = { x: currentX, z: currentZ };
    }
  };

  const handlePointerUp = () => {
    if (isMoving) {
      setIsMoving(false);
      onIsDraggingChange(false);
      dragStartPointRef.current = null;
    }
  };

  return (
    <>
      <ambientLight intensity={0.55} color="#cbd5e1" />
      <directionalLight
        position={[sunPos.x, sunPos.y, sunPos.z]}
        intensity={2.0}
        color={sunLightColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={65}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0002}
      />

      {/* Visible Glowing 3D Sun Sphere & Corona */}
      <group position={[sunPos.x, sunPos.y, sunPos.z]}>
        <mesh>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.8, 24, 24]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.4} />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.8, 24, 24]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.15} />
        </mesh>
        <Text
          position={[0, 2.2, 0]}
          fontSize={0.85}
          color="#fef08a"
          anchorX="center"
          anchorY="bottom"
        >
          {formatSunTime(sunHour)}
        </Text>
      </group>

      {/* Celestial Sun Transit Arc Across the Sky */}
      <CelestialSunArc />

      {/* Sunlight Ray Connecting Sun to the Roof Center */}
      <SunlightRay sunPos={sunPos} />

      {/* Ground Reference Plane with Grid */}
      <gridHelper args={[40, 40, '#475569', '#1e293b']} position={[0, -0.02, 0]} />

      {/* Ground Shadow Receiver Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <shadowMaterial opacity={0.4} />
      </mesh>

      {/* Cardinal Direction Markers on the Ground */}
      <Text position={[0, 0.05, -18]} fontSize={1.3} color="#f59e0b" rotation={[-Math.PI / 2, 0, 0]}>
        N (0°)
      </Text>
      <Text position={[0, 0.05, 18]} fontSize={1.3} color="#f59e0b" rotation={[-Math.PI / 2, 0, 0]}>
        S (180°)
      </Text>
      <Text position={[18, 0.05, 0]} fontSize={1.3} color="#94a3b8" rotation={[-Math.PI / 2, 0, 0]}>
        E (90°)
      </Text>
      <Text position={[-18, 0.05, 0]} fontSize={1.3} color="#94a3b8" rotation={[-Math.PI / 2, 0, 0]}>
        W (270°)
      </Text>

      {/* Horizontal Drag Interaction Plane for Move Tool */}
      <mesh
        ref={dragPlaneRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, BUILDING_EAVE_HEIGHT, 0]}
        visible={false}
        onPointerMove={handlePointerMoveOnPlane}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[120, 120]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Render ALL Roof Sections in their true spatial positions */}
      {roofSections.map((sec) => (
        <Roof3DMesh
          key={sec.id}
          section={sec}
          siteCenter={siteCenter}
          isActive={sec.id === activeSection?.id}
          activeTool={activeTool}
          onSelect={() => setActiveSectionId(sec.id)}
          onSetPivotEdge={(idx) => setRoofSectionPivotEdge(sec.id, idx)}
          onStartMoveDrag={handleStartMoveDrag}
        />
      ))}

      <OrbitControls
        makeDefault
        enabled={!isMoving}
        target={[0, BUILDING_EAVE_HEIGHT, 0]} // Orbit cleanly around the house roof
        minDistance={5}
        maxDistance={65}
        maxPolarAngle={Math.PI / 2.05} // prevent camera going underneath ground
      />
    </>
  );
};

export const Roof3DPreviewCanvas: React.FC = () => {
  const {
    setViewMode,
    sunHour,
    setSunHour,
    roofSections,
    activeSectionId,
    active3DTool,
    setActive3DTool,
    setRoofSectionPivotEdge,
    updateRoofSectionConfig,
    translateRoofSection,
    loadDemoRoofPolygon,
  } = useSolarMapperStore();

  const [isDraggingRoof, setIsDraggingRoof] = useState(false);

  const activeSection =
    roofSections.find((s) => s.id === activeSectionId) || roofSections[0];

  const pivotEdge = activeSection ? (activeSection.pivotEdgeIndex ?? 0) : 0;
  const numEdges = activeSection ? activeSection.vertices.length : 0;

  // Nudge active roof plane by fixed delta
  const handleNudge = (deltaX: number, deltaY: number) => {
    if (!activeSection) return;
    translateRoofSection(activeSection.id, deltaX, deltaY);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-[#090D16] shadow-xl">
      {/* 3D WebGL Canvas */}
      <div className="w-full h-[520px] sm:h-[600px] lg:h-[660px] relative">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
              Loading 3D Solar Model...
            </div>
          }
        >
          <Canvas
            shadows
            camera={{ position: [16, 20, 26], fov: 46 }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            <SceneContent
              sunHour={sunHour}
              activeTool={active3DTool}
              onIsDraggingChange={setIsDraggingRoof}
            />
          </Canvas>
        </Suspense>

        {/* Top-Right: View Mode Switcher */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('2d_satellite')}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-bold backdrop-blur-md shadow-md transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap flex-shrink-0"
          >
            <Map className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="whitespace-nowrap">2D Satellite Map</span>
          </button>
        </div>

        {/* Top-Left: Active Roof & Tool Status HUD */}
        {activeSection && activeSection.vertices.length >= 3 && (
          <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2 p-1.5 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-md text-xs">
            <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 font-bold font-mono">
              {activeSection.name || 'Active Face'}
            </span>
            <span className="text-slate-400 font-mono text-[11px] pr-2">
              {activeSection.pitchDeg === 0 ? 'Flat (0°)' : `${activeSection.pitchDeg}° Tilt`} • Side {pivotEdge + 1} Hinge
            </span>
          </div>
        )}

        {/* Empty State Banner if no roof has been drawn */}
        {(!activeSection || activeSection.vertices.length < 3) && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs z-10 p-6 text-center">
            <div className="max-w-md p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-3">
              <Layers className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Roof Polygons Traced Yet</h4>
              <p className="text-xs text-slate-400">
                Trace your roof corners on the satellite map or load our sample roof to inspect the 3D pitched model and packed solar array.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={loadDemoRoofPolygon}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-sm"
                >
                  Load Sample Roof
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('2d_satellite')}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition-colors"
                >
                  Return to Satellite
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating 3D Studio Controls Dock (Double-Bezel High-End Visual Design) */}
        {activeSection && activeSection.vertices.length >= 3 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 max-w-[calc(100%-2rem)] overflow-x-auto no-scrollbar">
            <div className="p-1.5 rounded-full bg-slate-950/90 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl flex items-center gap-1.5 select-none">
              {/* Tool Mode: Tilt by Side Axis */}
              <button
                type="button"
                onClick={() => setActive3DTool('hinge')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap flex-shrink-0 ${
                  active3DTool === 'hinge' || active3DTool === 'inspect'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Rotate and pitch roof around its sides (edges)"
              >
                <Anchor className="w-3.5 h-3.5 text-current flex-shrink-0" />
                <span>Tilt by Side</span>
              </button>

              {/* Tool Mode: Move Roof */}
              <button
                type="button"
                onClick={() => setActive3DTool('move')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap flex-shrink-0 ${
                  active3DTool === 'move'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Move roof across the site plane"
              >
                <Move className="w-3.5 h-3.5 text-current flex-shrink-0" />
                <span>Move Roof</span>
              </button>

              <div className="w-[1px] h-4 bg-white/15 mx-1 flex-shrink-0" />

              {/* Side Hinge Switcher Chips */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {activeSection.edgeLengthsMeters.map((len, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRoofSectionPivotEdge(activeSection.id, idx)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
                      pivotEdge === idx
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-500/40'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={`Make Side ${idx + 1} (${len.toFixed(1)}m) the rotation axis`}
                  >
                    <span>S{idx + 1}</span>
                    <span className="opacity-70 text-[9px]">{len.toFixed(0)}m</span>
                  </button>
                ))}
              </div>

              <div className="w-[1px] h-4 bg-white/15 mx-1 flex-shrink-0" />

              {/* Quick Flat 0° Reset */}
              <button
                type="button"
                onClick={() =>
                  updateRoofSectionConfig(activeSection.id, { pitchDeg: 0 })
                }
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
                  activeSection.pitchDeg === 0
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Make roof completely flat (0° pitch)"
              >
                <Minus className="w-3 h-3 text-current" />
                <span>Flat 0°</span>
              </button>

              {/* Quick Pitch Degrees Slider */}
              <div className="flex items-center gap-2 px-2 flex-shrink-0">
                <input
                  type="range"
                  min="0"
                  max="45"
                  step="1"
                  value={activeSection.pitchDeg}
                  onChange={(e) =>
                    updateRoofSectionConfig(activeSection.id, {
                      pitchDeg: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-20 accent-amber-500 h-1.5 bg-slate-800 rounded-full cursor-pointer"
                  title="Adjust roof pitch angle"
                />
                <span className="font-mono text-xs font-bold text-amber-400 min-w-[28px]">
                  {activeSection.pitchDeg}°
                </span>
              </div>

              {/* Move Nudge Buttons (Visible when Move tool is selected) */}
              {active3DTool === 'move' && (
                <>
                  <div className="w-[1px] h-4 bg-white/15 mx-1 flex-shrink-0" />
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleNudge(-0.5, 0)}
                      className="p-1 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                      title="Nudge West (-0.5m)"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge(0.5, 0)}
                      className="p-1 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                      title="Nudge East (+0.5m)"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge(0, 0.5)}
                      className="p-1 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                      title="Nudge North (+0.5m)"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudge(0, -0.5)}
                      className="p-1 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                      title="Nudge South (-0.5m)"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Bottom Sun Position & Time Slider Island */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-20 p-3 rounded-2xl bg-slate-950/90 border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-white whitespace-nowrap flex-shrink-0">
              <Sun className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="whitespace-nowrap">Sun Simulation:</span>
              <span className="font-mono text-amber-400 whitespace-nowrap">{formatSunTime(sunHour)}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSunHour(6)}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                6 AM
              </button>
              <button
                type="button"
                onClick={() => setSunHour(12)}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors font-bold whitespace-nowrap"
              >
                12 PM
              </button>
              <button
                type="button"
                onClick={() => setSunHour(18)}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                6 PM
              </button>
            </div>
          </div>

          <input
            type="range"
            min="6"
            max="18"
            step="0.25"
            value={sunHour}
            onChange={(e) => setSunHour(parseFloat(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>6:00 AM (Sunrise East)</span>
            <span>12:00 PM (Solar Noon South)</span>
            <span>6:00 PM (Sunset West)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
