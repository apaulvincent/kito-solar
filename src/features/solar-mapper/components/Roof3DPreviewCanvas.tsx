// src/features/solar-mapper/components/Roof3DPreviewCanvas.tsx
import React, { useMemo, useState, useRef, useCallback, Suspense } from 'react';
import { Canvas, useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sun,
  Map,
  Compass,
  Layers,
  Anchor,
  Move,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
} from 'lucide-react';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import {
  calculateCentroid,
  projectSinglePointToMeters,
  getOuterTiltSides,
} from '../utils/geodesicMath';
import { GeoPoint, RoofPolygonSection } from '../types/solarMapper';

const BUILDING_EAVE_HEIGHT = 2.4; // 2.4m residential eave height

/**
 * Calculates the 3D position of the Sun along its celestial transit.
 * East (+X) at 6:00 AM -> Noon South (+Z peak height) -> West (-X) at 6:00 PM.
 */
function getSunPosition(hour: number, radius = 24): THREE.Vector3 {
  const progress = (hour - 6) / 12; // 0 (6 AM) to 1 (6 PM)
  const angle = progress * Math.PI; // 0 to PI

  const x = Math.cos(angle) * radius;
  const y = Math.max(1.5, Math.sin(angle) * radius * 0.95);
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

// Cardinal direction label helper
function getCardinalLabel(azimuthDeg: number): string {
  const normalized = ((azimuthDeg % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'North';
  if (normalized >= 22.5 && normalized < 67.5) return 'NE';
  if (normalized >= 67.5 && normalized < 112.5) return 'East';
  if (normalized >= 112.5 && normalized < 157.5) return 'SE';
  if (normalized >= 157.5 && normalized < 202.5) return 'South';
  if (normalized >= 202.5 && normalized < 247.5) return 'SW';
  if (normalized >= 247.5 && normalized < 292.5) return 'West';
  return 'NW';
}

/**
 * Single 3D Roof Mesh Component.
 * Pivots along one of the EXACTLY 4 OUTER BOUNDING SIDES (never inner cutouts).
 */
const Roof3DMesh: React.FC<{
  section: RoofPolygonSection;
  siteCenter: GeoPoint;
  isActive: boolean;
  onSelect: () => void;
  onSetPivotEdge: (edgeIdx: number) => void;
  onCentroidWorldUpdate: (pos: THREE.Vector3) => void;
}> = ({
  section,
  siteCenter,
  isActive,
  onSelect,
  onSetPivotEdge,
  onCentroidWorldUpdate,
}) => {
  const centroidAnchorRef = useRef<THREE.Group>(null);

  const secCentroid = useMemo(
    () => calculateCentroid(section.vertices),
    [section.vertices]
  );

  // Project vertices to local meters relative to site center (East = +x, North = +y)
  const worldMeters = useMemo(
    () => section.vertices.map((v) => projectSinglePointToMeters(v, siteCenter)),
    [section.vertices, siteCenter]
  );

  const secCentroidMeters = useMemo(
    () => projectSinglePointToMeters(secCentroid, siteCenter),
    [secCentroid, siteCenter]
  );

  // ALWAYS 4 OUTER SIDES (Side 1..4), never inner cutouts
  const outerSides = useMemo(
    () => getOuterTiltSides(section.vertices),
    [section.vertices]
  );

  const pivotIdx = ((section.pivotEdgeIndex ?? 0) % 4 + 4) % 4;
  const activeSide = outerSides[pivotIdx] ?? outerSides[0];

  // Active Hinge edge in local meters relative to site center
  const { pivotMidpoint, edgeAngleRad, canonicalVertices, ySign, centroidCanonical } = useMemo(() => {
    if (worldMeters.length < 3 || outerSides.length < 4) {
      return {
        pivotMidpoint: { x: 0, y: 0 },
        edgeAngleRad: 0,
        canonicalVertices: [],
        ySign: 1,
        centroidCanonical: { x: 0, y: 0 },
      };
    }

    // Midpoint of active outer side
    const mid = {
      x: secCentroidMeters.x + activeSide.midpointMeters.x,
      y: secCentroidMeters.y + activeSide.midpointMeters.y,
    };

    const dx = activeSide.endMeters.x - activeSide.startMeters.x;
    const dy = activeSide.endMeters.y - activeSide.startMeters.y;
    const alpha = Math.atan2(dy, dx);

    // Rotate polygon vertices relative to mid by -alpha so hinge lies on y = 0
    const rotated = worldMeters.map((v) => {
      const rx = v.x - mid.x;
      const ry = v.y - mid.y;
      return rotate2D(rx, ry, -alpha);
    });

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
      centroidCanonical: { x: cRel.x, y: cRel.y * sign },
    };
  }, [worldMeters, outerSides, activeSide, secCentroidMeters]);

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
      const pWorldX = secCentroidMeters.x + panel.x;
      const pWorldY = secCentroidMeters.y + panel.y;
      const rx = pWorldX - pivotMidpoint.x;
      const ry = pWorldY - pivotMidpoint.y;

      const canX = rx * cosA - ry * sinA;
      const canY = (rx * sinA + ry * cosA) * ySign;

      const baseRot = (panel.rotationDeg || 0) * (Math.PI / 180) - edgeAngleRad;
      const canRot = ySign < 0 ? -baseRot : baseRot;

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

  // Feed real-time 3D world centroid position to scene gizmos
  useFrame(() => {
    if (isActive && centroidAnchorRef.current) {
      const worldPos = new THREE.Vector3();
      centroidAnchorRef.current.getWorldPosition(worldPos);
      onCentroidWorldUpdate(worldPos);
    }
  });

  if (!shape) return null;

  // In Three.js: World +X = East, World +Z = South, World -Z = North
  const anchorX = pivotMidpoint.x;
  const anchorY = BUILDING_EAVE_HEIGHT;
  const anchorZ = -pivotMidpoint.y;

  const pitchRad = THREE.MathUtils.degToRad(section.pitchDeg);
  const rollRad = THREE.MathUtils.degToRad(section.rollDeg ?? 0);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Anchor Group located at the Midpoint of the Active Outer Tilt Edge */}
      <group position={[anchorX, anchorY, anchorZ]}>
        {/* Horizontal orientation along the outer edge vector */}
        <group rotation={[0, edgeAngleRad, 0]}>
          {/* Pitch & Roll Rotation along local X and Z axes */}
          <group rotation={[pitchRad, 0, rollRad]}>
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
                    position={[panel.canonicalX, panel.canonicalY, 0.19]}
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

              {/* ONLY 4 OUTER SIDES TO TILT (Side 1..4), never inner cutouts */}
              {isActive &&
                outerSides.map((side, i) => {
                  const isPivot = i === pivotIdx;
                  // Transform outer side endpoints into canonical coordinates
                  const cosA = Math.cos(-edgeAngleRad);
                  const sinA = Math.sin(-edgeAngleRad);

                  const toCan = (pt: { x: number; y: number }) => {
                    const worldX = secCentroidMeters.x + pt.x;
                    const worldY = secCentroidMeters.y + pt.y;
                    const rx = worldX - pivotMidpoint.x;
                    const ry = worldY - pivotMidpoint.y;
                    return {
                      x: rx * cosA - ry * sinA,
                      y: (rx * sinA + ry * cosA) * ySign,
                    };
                  };

                  const canStart = toCan(side.startMeters);
                  const canEnd = toCan(side.endMeters);
                  const midX = (canStart.x + canEnd.x) / 2;
                  const midY = (canStart.y + canEnd.y) / 2;
                  const edgeLengthM = side.lengthM;

                  return (
                    <group key={`outer-edge-${i}`}>
                      {/* Edge Line Segment on Outer Perimeter */}
                      <Line
                        points={[
                          [canStart.x, canStart.y, 0.17],
                          [canEnd.x, canEnd.y, 0.17],
                        ]}
                        color={isPivot ? '#f59e0b' : '#94a3b8'}
                        lineWidth={isPivot ? 4.5 : 2}
                        transparent
                        opacity={isPivot ? 1.0 : 0.6}
                      />

                      {/* Clickable Hit Cylinder along edge for switching axis */}
                      <mesh
                        position={[midX, midY, 0.17]}
                        rotation={[
                          0,
                          0,
                          Math.atan2(canEnd.y - canStart.y, canEnd.x - canStart.x) + Math.PI / 2,
                        ]}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetPivotEdge(i);
                        }}
                      >
                        <cylinderGeometry args={[0.3, 0.3, edgeLengthM, 8]} />
                        <meshBasicMaterial transparent opacity={0} />
                      </mesh>

                      {/* Active Hinge Visual Accent & 3D Tag */}
                      <group position={[midX, midY, 0.23]}>
                        <Text
                          fontSize={isPivot ? 0.42 : 0.32}
                          color={isPivot ? '#fbbf24' : '#94a3b8'}
                          anchorX="center"
                          anchorY="middle"
                          position={[0, 0.35, 0]}
                        >
                          {isPivot
                            ? `★ Hinge Side ${i + 1} (${edgeLengthM.toFixed(1)}m)`
                            : `Side ${i + 1} (${edgeLengthM.toFixed(1)}m)`}
                        </Text>
                      </group>
                    </group>
                  );
                })}

              {/* Anchor Node at Centroid of Roof Face */}
              <group
                ref={centroidAnchorRef}
                position={[centroidCanonical.x, centroidCanonical.y, 0.25]}
              />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

/**
 * 3-AXIS 360° XYZ ROTATION GIZMO (MATCHES USER REFERENCE IMAGE EXACTLY)
 * Features:
 * - Green Ring (Y-Axis): Full 360° horizontal circle around vertical axis (Yaw / Compass Heading).
 * - Red Ring (X-Axis): Full 360° vertical circle around X-axis (Pitch / Tilt).
 * - Blue Ring (Z-Axis): Full 360° vertical circle around Z-axis (Roll / Cross-tilt).
 * - Center pivot reticle with grab handles matching the user's reference image!
 */
const BlenderRotationDial3D: React.FC<{
  center: THREE.Vector3;
  section: RoofPolygonSection;
  onIsDraggingChange: (isDragging: boolean) => void;
}> = ({ center, section, onIsDraggingChange }) => {
  const { updateRoofSectionConfig } = useSolarMapperStore();
  const { camera, gl } = useThree();

  const [activeAxis, setActiveAxis] = useState<'x' | 'y' | 'z' | null>(null);
  const [hudText, setHudText] = useState<string | null>(null);

  const radius = 3.2; // 3.2m diameter ring

  // Interactive Drag for Green Y-Axis Ring (Full 360° Azimuth / Yaw)
  const handleYPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onIsDraggingChange(true);
    setActiveAxis('y');

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -center.y);
    const raycaster = new THREE.Raycaster();

    const onPointerMove = (evt: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const target = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(plane, target);
      if (!hit) return;

      const dx = hit.x - center.x;
      const dz = hit.z - center.z;
      // In Three.js: -Z is North, +X is East, +Z is South, -X is West
      const angleDeg = (Math.atan2(dx, -dz) * (180 / Math.PI) + 360) % 360;
      const roundAngle = Math.round(angleDeg);
      updateRoofSectionConfig(section.id, { azimuthDeg: roundAngle });
      setHudText(`Yaw (Y): ${roundAngle}° (${getCardinalLabel(roundAngle)})`);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      onIsDraggingChange(false);
      setActiveAxis(null);
      setHudText(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Interactive Drag for Red X-Axis Ring (Pitch / Elevation Tilt)
  const handleXPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onIsDraggingChange(true);
    setActiveAxis('x');
    const startY = e.clientY;
    const startPitch = section.pitchDeg;

    const onPointerMove = (evt: PointerEvent) => {
      const deltaY = startY - evt.clientY;
      const deltaPitch = deltaY * 0.35;
      const newPitch = Math.max(0, Math.min(50, Math.round(startPitch + deltaPitch)));
      updateRoofSectionConfig(section.id, { pitchDeg: newPitch });
      setHudText(`Pitch (X): ${newPitch}°`);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      onIsDraggingChange(false);
      setActiveAxis(null);
      setHudText(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Interactive Drag for Blue Z-Axis Ring (Roll / Cross-tilt)
  const handleZPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onIsDraggingChange(true);
    setActiveAxis('z');
    const startX = e.clientX;
    const startRoll = section.rollDeg ?? 0;

    const onPointerMove = (evt: PointerEvent) => {
      const deltaX = evt.clientX - startX;
      const deltaRoll = deltaX * 0.35;
      const newRoll = Math.max(-45, Math.min(45, Math.round(startRoll + deltaRoll)));
      updateRoofSectionConfig(section.id, { rollDeg: newRoll });
      setHudText(`Roll (Z): ${newRoll}°`);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      onIsDraggingChange(false);
      setActiveAxis(null);
      setHudText(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Positions of Reticle Grab Handles on each ring
  const yRad = (section.azimuthDeg * Math.PI) / 180;
  const yReticlePos: [number, number, number] = [
    radius * Math.sin(yRad),
    0,
    -radius * Math.cos(yRad),
  ];

  const xRad = (section.pitchDeg * Math.PI) / 180;
  const xReticlePos: [number, number, number] = [
    0,
    radius * Math.sin(xRad),
    radius * Math.cos(xRad),
  ];

  const zRad = ((section.rollDeg ?? 0) * Math.PI) / 180;
  const zReticlePos: [number, number, number] = [
    radius * Math.cos(zRad),
    radius * Math.sin(zRad),
    0,
  ];

  return (
    <group position={[center.x, center.y, center.z]}>
      {/* Outer Orbit Sphere Reference Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 1.05, radius * 1.06, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* 1. GREEN RING (Y-AXIS / 360° YAW & AZIMUTH) */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} onPointerDown={handleYPointerDown}>
          <torusGeometry args={[radius, activeAxis === 'y' ? 0.07 : 0.045, 16, 64]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#15803d"
            emissiveIntensity={activeAxis === 'y' ? 1.0 : 0.4}
            roughness={0.2}
          />
        </mesh>
        {/* Invisible Hit Area */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} onPointerDown={handleYPointerDown}>
          <torusGeometry args={[radius, 0.25, 8, 32]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Grab Reticle on Y Ring */}
        <group position={yReticlePos} onPointerDown={handleYPointerDown}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.15, 0.24, 24]} />
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
        </group>
      </group>

      {/* 2. RED RING (X-AXIS / PITCH TILT) */}
      <group>
        <mesh rotation={[0, Math.PI / 2, 0]} onPointerDown={handleXPointerDown}>
          <torusGeometry args={[radius, activeAxis === 'x' ? 0.07 : 0.045, 16, 64]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#b91c1c"
            emissiveIntensity={activeAxis === 'x' ? 1.0 : 0.4}
            roughness={0.2}
          />
        </mesh>
        {/* Invisible Hit Area */}
        <mesh rotation={[0, Math.PI / 2, 0]} onPointerDown={handleXPointerDown}>
          <torusGeometry args={[radius, 0.25, 8, 32]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Grab Reticle on X Ring */}
        <group position={xReticlePos} onPointerDown={handleXPointerDown}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <ringGeometry args={[0.15, 0.24, 24]} />
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>

      {/* 3. BLUE RING (Z-AXIS / ROLL TILT) */}
      <group>
        <mesh rotation={[0, 0, 0]} onPointerDown={handleZPointerDown}>
          <torusGeometry args={[radius, activeAxis === 'z' ? 0.07 : 0.045, 16, 64]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#1d4ed8"
            emissiveIntensity={activeAxis === 'z' ? 1.0 : 0.4}
            roughness={0.2}
          />
        </mesh>
        {/* Invisible Hit Area */}
        <mesh rotation={[0, 0, 0]} onPointerDown={handleZPointerDown}>
          <torusGeometry args={[radius, 0.25, 8, 32]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Grab Reticle on Z Ring */}
        <group position={zReticlePos} onPointerDown={handleZPointerDown}>
          <mesh rotation={[0, 0, 0]}>
            <ringGeometry args={[0.15, 0.24, 24]} />
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#3b82f6" />
          </mesh>
        </group>
      </group>

      {/* Center Pivot Reticle matching Reference Image */}
      <group>
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.3, 32]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Live Floating HUD Badge while dragging */}
      {hudText && (
        <group position={[0, radius + 0.6, 0]}>
          <Text fontSize={0.42} color="#ffffff" anchorX="center" anchorY="bottom">
            {hudText}
          </Text>
        </group>
      )}
    </group>
  );
};

/**
 * 3D MOVE GIZMO (PRECISION CAD GROUND TRANSLATION)
 */
const MoveGizmo3D: React.FC<{
  center: THREE.Vector3;
  section: RoofPolygonSection;
  onIsDraggingChange: (isDragging: boolean) => void;
}> = ({ center, section, onIsDraggingChange }) => {
  const { translateRoofSection } = useSolarMapperStore();
  const { camera, gl } = useThree();

  const [dragDelta, setDragDelta] = useState<{ x: number; y: number } | null>(null);

  const handlePointerDown = (
    e: ThreeEvent<PointerEvent>,
    axis: 'free' | 'x' | 'z'
  ) => {
    e.stopPropagation();
    onIsDraggingChange(true);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -center.y);
    const raycaster = new THREE.Raycaster();

    const getHit = (clientX: number, clientY: number): THREE.Vector3 | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const target = new THREE.Vector3();
      return raycaster.ray.intersectPlane(plane, target);
    };

    let lastHit = getHit(e.clientX, e.clientY);
    let accumX = 0;
    let accumY = 0;

    const onPointerMove = (evt: PointerEvent) => {
      const currentHit = getHit(evt.clientX, evt.clientY);
      if (!currentHit || !lastHit) return;

      let dx = currentHit.x - lastHit.x;
      let dz = currentHit.z - lastHit.z;

      if (axis === 'x') dz = 0;
      if (axis === 'z') dx = 0;

      // In geo space: East is +X, North is -Z
      const deltaGeoX = dx;
      const deltaGeoY = -dz;

      if (Math.hypot(dx, dz) >= 0.04) {
        translateRoofSection(section.id, deltaGeoX, deltaGeoY);
        accumX += deltaGeoX;
        accumY += deltaGeoY;
        setDragDelta({ x: Math.round(accumX * 10) / 10, y: Math.round(accumY * 10) / 10 });
        lastHit = currentHit;
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      onIsDraggingChange(false);
      setDragDelta(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <group position={[center.x, center.y, center.z]}>
      {/* 1. Center Planar Free 2D Drag Disc */}
      <group onPointerDown={(e) => handlePointerDown(e, 'free')}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.75, 32]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 32]} />
          <meshBasicMaterial color="#0284c7" side={THREE.DoubleSide} transparent opacity={0.45} />
        </mesh>
        <Line points={[[-0.4, 0, 0], [0.4, 0, 0]]} color="#ffffff" lineWidth={2} />
        <Line points={[[0, 0, -0.4], [0, 0, 0.4]]} color="#ffffff" lineWidth={2} />
        <Text
          position={[0, -0.95, 0.05]}
          fontSize={0.34}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
        >
          Drag to Move (Free 2D)
        </Text>
      </group>

      {/* 2. East-West Translation Axis Arrow */}
      <group onPointerDown={(e) => handlePointerDown(e, 'x')}>
        <Line points={[[-2.0, 0, 0], [2.0, 0, 0]]} color="#f59e0b" lineWidth={3} />
        <mesh position={[2.0, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.16, 0.4, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[-2.0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.16, 0.4, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <Text position={[2.35, 0, 0]} fontSize={0.3} color="#f59e0b" anchorX="left" anchorY="middle">
          +E
        </Text>
        <Text position={[-2.35, 0, 0]} fontSize={0.3} color="#f59e0b" anchorX="right" anchorY="middle">
          +W
        </Text>
      </group>

      {/* 3. North-South Translation Axis Arrow */}
      <group onPointerDown={(e) => handlePointerDown(e, 'z')}>
        <Line points={[[0, 0, -2.0], [0, 0, 2.0]]} color="#38bdf8" lineWidth={3} />
        <mesh position={[0, 0, -2.0]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.16, 0.4, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[0, 0, 2.0]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.16, 0.4, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <Text position={[0, 0, -2.35]} fontSize={0.3} color="#38bdf8" anchorX="center" anchorY="bottom">
          +N
        </Text>
        <Text position={[0, 0, 2.35]} fontSize={0.3} color="#38bdf8" anchorX="center" anchorY="top">
          +S
        </Text>
      </group>

      {/* Live Delta Readout Badge while dragging */}
      {dragDelta && (
        <group position={[0, 1.2, 0]}>
          <Text fontSize={0.42} color="#ffffff" anchorX="center" anchorY="bottom">
            {`Δ East: ${dragDelta.x >= 0 ? '+' : ''}${dragDelta.x}m, North: ${dragDelta.y >= 0 ? '+' : ''}${dragDelta.y}m`}
          </Text>
        </group>
      )}
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
    <Line points={points} color="#f59e0b" lineWidth={2} transparent opacity={0.45} />
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
    coordinates,
  } = useSolarMapperStore();

  const [isInteractingWithGizmo, setIsInteractingWithGizmo] = useState(false);
  const [activeRoofWorldCenter, setActiveRoofWorldCenter] = useState<THREE.Vector3>(
    () => new THREE.Vector3(0, BUILDING_EAVE_HEIGHT, 0)
  );

  const handleGizmoDragState = useCallback(
    (isDragging: boolean) => {
      setIsInteractingWithGizmo(isDragging);
      onIsDraggingChange(isDragging);
    },
    [onIsDraggingChange]
  );

  const sunPos = useMemo(() => getSunPosition(sunHour, 24), [sunHour]);

  // Center of the coordinate system
  const siteCenter = useMemo(() => {
    if (roofSections.length > 0) {
      const allVertices = roofSections.flatMap((s) => s.vertices);
      return calculateCentroid(allVertices);
    }
    return coordinates;
  }, [roofSections, coordinates]);

  const sunLightColor = useMemo(() => {
    if (sunHour < 7.5 || sunHour > 16.5) return '#fed7aa';
    if (sunHour < 9.5 || sunHour > 14.5) return '#fef08a';
    return '#ffffff';
  }, [sunHour]);

  const activeSection =
    roofSections.find((s) => s.id === activeSectionId) || roofSections[0];

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

      {/* Sun Sphere & Corona */}
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

      {/* Celestial Sun Transit Arc */}
      <CelestialSunArc />

      {/* Sunlight Ray */}
      <SunlightRay sunPos={sunPos} />

      {/* Ground Reference Plane with Grid */}
      <gridHelper args={[40, 40, '#475569', '#1e293b']} position={[0, -0.02, 0]} />

      {/* Ground Shadow Receiver */}
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

      {/* Render ALL Roof Sections */}
      {roofSections.map((sec) => (
        <Roof3DMesh
          key={sec.id}
          section={sec}
          siteCenter={siteCenter}
          isActive={sec.id === activeSection?.id}
          onSelect={() => setActiveSectionId(sec.id)}
          onSetPivotEdge={(idx) => setRoofSectionPivotEdge(sec.id, idx)}
          onCentroidWorldUpdate={setActiveRoofWorldCenter}
        />
      ))}

      {/* 3D GIZMOS MOUNTED AT THE TRUE ROOF 3D CENTER */}
      {activeSection && activeSection.vertices.length >= 3 && (
        <>
          {activeTool === 'move' ? (
            <MoveGizmo3D
              center={activeRoofWorldCenter}
              section={activeSection}
              onIsDraggingChange={handleGizmoDragState}
            />
          ) : (
            <BlenderRotationDial3D
              center={activeRoofWorldCenter}
              section={activeSection}
              onIsDraggingChange={handleGizmoDragState}
            />
          )}
        </>
      )}

      {/* Orbit Controls (Automatically paused during gizmo manipulation) */}
      <OrbitControls
        makeDefault
        enabled={!isInteractingWithGizmo}
        target={[0, BUILDING_EAVE_HEIGHT, 0]}
        minDistance={5}
        maxDistance={65}
        maxPolarAngle={Math.PI / 2.05}
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

  const [, setIsDraggingRoof] = useState(false);

  const activeSection =
    roofSections.find((s) => s.id === activeSectionId) || roofSections[0];

  const pivotEdge = activeSection ? ((activeSection.pivotEdgeIndex ?? 0) % 4) : 0;

  // ALWAYS EXACTLY 4 OUTER SIDES (Side 1..4), never inner cutouts
  const outerSides = useMemo(
    () => (activeSection ? getOuterTiltSides(activeSection.vertices) : []),
    [activeSection]
  );

  // Nudge active roof plane by fixed delta (East/North)
  const handleNudge = (deltaX: number, deltaY: number) => {
    if (!activeSection) return;
    translateRoofSection(activeSection.id, deltaX, deltaY);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-[#070b14] shadow-2xl">
      {/* 3D WebGL Canvas */}
      <div className="w-full h-[520px] sm:h-[600px] lg:h-[680px] relative">
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
          <div className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-2 p-1.5 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-md text-xs">
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

        {/* TOP-CENTER FLOATING STUDIO CONTROLS DOCK (High-End Double-Bezel Design) */}
        {activeSection && activeSection.vertices.length >= 3 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-[calc(100%-2rem)] overflow-x-auto no-scrollbar">
            <div className="p-1.5 rounded-full bg-slate-950/90 border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl flex items-center gap-1.5 select-none">
              {/* Tool Mode: Rotate & Tilt (XYZ 3D Rotation Gizmo) */}
              <button
                type="button"
                onClick={() => setActive3DTool('hinge')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap flex-shrink-0 ${
                  active3DTool === 'hinge' || active3DTool === 'inspect'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Rotate pitch, azimuth and roll with 3D XYZ rotation dial"
              >
                <RotateCw className="w-3.5 h-3.5 text-current flex-shrink-0" />
                <span>Rotate & Tilt</span>
              </button>

              {/* Tool Mode: Move Roof */}
              <button
                type="button"
                onClick={() => setActive3DTool('move')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap flex-shrink-0 ${
                  active3DTool === 'move'
                    ? 'bg-sky-400 text-slate-950 shadow-md shadow-sky-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Move roof across the site plane"
              >
                <Move className="w-3.5 h-3.5 text-current flex-shrink-0" />
                <span>Move Roof</span>
              </button>

              <div className="w-[1px] h-4 bg-white/15 mx-1 flex-shrink-0" />

              {/* ALWAYS EXACTLY 4 OUTER SIDES (Side 1..4), never inner cutouts */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {outerSides.map((side, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRoofSectionPivotEdge(activeSection.id, idx)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
                      pivotEdge === idx
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-500/40'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={`Hinge along ${side.name} (${side.lengthM.toFixed(1)}m)`}
                  >
                    <span>{side.shortName}</span>
                    <span className="opacity-70 text-[9px]">{side.cardinalDir[0]} • {side.lengthM.toFixed(0)}m</span>
                  </button>
                ))}
              </div>

              <div className="w-[1px] h-4 bg-white/15 mx-1 flex-shrink-0" />

              {/* Quick Flat 0° Reset */}
              <button
                type="button"
                onClick={() =>
                  updateRoofSectionConfig(activeSection.id, { pitchDeg: 0, rollDeg: 0 })
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

              {/* Mini Pitch Slider */}
              <div className="flex items-center gap-2 px-1.5 flex-shrink-0">
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
                  className="w-16 accent-amber-500 h-1.5 bg-slate-800 rounded-full cursor-pointer"
                  title="Adjust roof pitch angle"
                />
                <span className="font-mono text-xs font-bold text-amber-400 min-w-[28px]">
                  {activeSection.pitchDeg}°
                </span>
              </div>

              {/* Discrete Nudge Buttons (Visible when Move tool is selected) */}
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

        {/* BOTTOM SUN POSITION & TIME SLIDER ISLAND */}
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
