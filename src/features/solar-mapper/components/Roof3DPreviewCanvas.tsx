// src/features/solar-mapper/components/Roof3DPreviewCanvas.tsx
import React, { useMemo, useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
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

// Single 3D Roof Mesh Component with Solar Modules
const Roof3DMesh: React.FC<{
  section: RoofPolygonSection;
  siteCenter: GeoPoint;
  isActive: boolean;
  onSelect: () => void;
  onSetPivotEdge: (edgeIdx: number) => void;
}> = ({ section, siteCenter, isActive, onSelect, onSetPivotEdge }) => {
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
    return (((section.pivotEdgeIndex ?? 0) % N) + N) % N;
  }, [section.pivotEdgeIndex, N]);

  // Compute Edge Pivot Frame
  const { pivotMidpoint, edgeAngleRad, canonicalVertices, ySign } = useMemo(() => {
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

  if (!shape) return null;

  // In Three.js: World +X = East, World +Z = South, World -Z = North
  const anchorX = pivotMidpoint.x;
  const anchorY = BUILDING_EAVE_HEIGHT;
  const anchorZ = -pivotMidpoint.y;

  const pitchRad = THREE.MathUtils.degToRad(section.pitchDeg);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Anchor Group located at the Midpoint of the Pivot Edge */}
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
                          [vStart.x, vStart.y, 0.17],
                          [vEnd.x, vEnd.y, 0.17],
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
                          Math.atan2(vEnd.y - vStart.y, vEnd.x - vStart.x) + Math.PI / 2,
                        ]}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetPivotEdge(i);
                        }}
                      >
                        <cylinderGeometry args={[0.25, 0.25, edgeLengthM, 8]} />
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
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

/**
 * 3D ROTATION GIZMO (IMAGE 1 STYLE)
 * Displays:
 * 1. Pitch Elevation Arc: Grab & drag along vertical arc to tilt roof (0° to 50°)
 * 2. Compass Azimuth Ring: Horizontal circular ring to rotate compass heading (0° to 360°)
 * 3. Outer Spherical Orbit Ring: Reference 3D CAD orbit sphere
 */
const RotationGizmo3D: React.FC<{
  section: RoofPolygonSection;
  siteCenter: GeoPoint;
  onIsDraggingChange: (isDragging: boolean) => void;
}> = ({ section, siteCenter, onIsDraggingChange }) => {
  const { updateRoofSectionConfig } = useSolarMapperStore();
  const { camera, gl } = useThree();

  const secCentroid = useMemo(
    () => calculateCentroid(section.vertices),
    [section.vertices]
  );
  const secCentroidMeters = useMemo(
    () => projectSinglePointToMeters(secCentroid, siteCenter),
    [secCentroid, siteCenter]
  );

  const N = section.vertices.length;
  const pivotIdx = useMemo(() => {
    if (N < 2) return 0;
    return (((section.pivotEdgeIndex ?? 0) % N) + N) % N;
  }, [section.pivotEdgeIndex, N]);

  const worldMeters = useMemo(
    () => section.vertices.map((v) => projectSinglePointToMeters(v, siteCenter)),
    [section.vertices, siteCenter]
  );

  // Compute Pivot Midpoint and Hinge normal direction
  const { pivotMidpoint3D, vNormal, edgeLength } = useMemo(() => {
    if (worldMeters.length < 2) {
      return {
        pivotMidpoint3D: new THREE.Vector3(0, BUILDING_EAVE_HEIGHT, 0),
        vNormal: new THREE.Vector3(0, 0, 1),
        edgeLength: 6,
      };
    }
    const pA = worldMeters[pivotIdx];
    const pB = worldMeters[(pivotIdx + 1) % N];

    const midX = (pA.x + pB.x) / 2;
    const midY = (pA.y + pB.y) / 2;
    const mid3D = new THREE.Vector3(midX, BUILDING_EAVE_HEIGHT, -midY);

    const dx = pB.x - pA.x;
    const dz = -(pB.y - pA.y); // In Three.js, -Z is North
    const vEdge = new THREE.Vector3(dx, 0, dz).normalize();

    // Normal perpendicular to edge in horizontal plane
    let norm = new THREE.Vector3(-vEdge.z, 0, vEdge.x);
    // Point towards roof centroid
    const c3D = new THREE.Vector3(secCentroidMeters.x, BUILDING_EAVE_HEIGHT, -secCentroidMeters.y);
    if (norm.dot(c3D.clone().sub(mid3D)) < 0) {
      norm.negate();
    }

    return {
      pivotMidpoint3D: mid3D,
      vNormal: norm,
      edgeLength: Math.hypot(dx, dz),
    };
  }, [worldMeters, pivotIdx, N, secCentroidMeters]);

  const centroid3D = useMemo(
    () => new THREE.Vector3(secCentroidMeters.x, BUILDING_EAVE_HEIGHT, -secCentroidMeters.y),
    [secCentroidMeters]
  );

  // Radius of the pitch arc
  const arcRadius = useMemo(
    () => Math.min(3.8, Math.max(2.2, edgeLength * 0.35)),
    [edgeLength]
  );

  // Points for Pitch Arc (0° to 50°)
  const pitchArcPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let deg = 0; deg <= 50; deg += 2) {
      const rad = (deg * Math.PI) / 180;
      const pt = pivotMidpoint3D
        .clone()
        .addScaledVector(vNormal, arcRadius * Math.cos(rad))
        .add(new THREE.Vector3(0, arcRadius * Math.sin(rad), 0));
      pts.push([pt.x, pt.y, pt.z]);
    }
    return pts;
  }, [pivotMidpoint3D, vNormal, arcRadius]);

  // Current Pitch Bead 3D Position
  const pitchBeadPos = useMemo(() => {
    const rad = (section.pitchDeg * Math.PI) / 180;
    return pivotMidpoint3D
      .clone()
      .addScaledVector(vNormal, arcRadius * Math.cos(rad))
      .add(new THREE.Vector3(0, arcRadius * Math.sin(rad), 0));
  }, [pivotMidpoint3D, vNormal, arcRadius, section.pitchDeg]);

  // Points for Compass Azimuth Circle
  const azimuthRadius = 3.4;
  const azimuthCirclePoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let deg = 0; deg <= 360; deg += 3) {
      const rad = (deg * Math.PI) / 180;
      const x = centroid3D.x + azimuthRadius * Math.sin(rad);
      const z = centroid3D.z - azimuthRadius * Math.cos(rad);
      pts.push([x, BUILDING_EAVE_HEIGHT + 0.05, z]);
    }
    return pts;
  }, [centroid3D]);

  // Position of Azimuth Handle Arrow
  const azimuthArrowPos = useMemo(() => {
    const rad = (section.azimuthDeg * Math.PI) / 180;
    return new THREE.Vector3(
      centroid3D.x + azimuthRadius * Math.sin(rad),
      BUILDING_EAVE_HEIGHT + 0.06,
      centroid3D.z - azimuthRadius * Math.cos(rad)
    );
  }, [centroid3D, section.azimuthDeg]);

  // Interactive Drag for Pitch Arc
  const handlePitchPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onIsDraggingChange(true);
    const startY = e.clientY;
    const startPitch = section.pitchDeg;

    const onPointerMove = (evt: PointerEvent) => {
      // Screen-space vertical drag: dragging upward tilts up, downward flattens
      const deltaY = startY - evt.clientY;
      const deltaPitch = deltaY * 0.35;
      const newPitch = Math.max(0, Math.min(50, Math.round(startPitch + deltaPitch)));
      updateRoofSectionConfig(section.id, { pitchDeg: newPitch });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      onIsDraggingChange(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Interactive Drag for Compass Azimuth Ring
  const handleAzimuthPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onIsDraggingChange(true);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BUILDING_EAVE_HEIGHT);
    const raycaster = new THREE.Raycaster();

    const onPointerMove = (evt: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const target = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(plane, target);
      if (!hit) return;

      const dx = hit.x - centroid3D.x;
      const dz = hit.z - centroid3D.z;
      // Clockwise from North (-Z)
      const angleDeg = (Math.atan2(dx, -dz) * (180 / Math.PI) + 360) % 360;
      updateRoofSectionConfig(section.id, { azimuthDeg: Math.round(angleDeg) });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      onIsDraggingChange(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <group>
      {/* 1. Outer Orbit Sphere Ring (Image 1 Style 3D Reference Ring) */}
      <Line
        points={azimuthCirclePoints}
        color="#ffffff"
        lineWidth={1.5}
        transparent
        opacity={0.3}
        dashed
        dashSize={0.4}
        gapSize={0.2}
      />

      {/* 2. Pitch Tilt Arc (Golden / Amber Curved Rail) */}
      <Line
        points={pitchArcPoints}
        color="#f59e0b"
        lineWidth={3.5}
        transparent
        opacity={0.85}
      />

      {/* Pitch Angle Degree Tick Marks along the Arc */}
      {[0, 15, 30, 45].map((tickDeg) => {
        const rad = (tickDeg * Math.PI) / 180;
        const tickPos = pivotMidpoint3D
          .clone()
          .addScaledVector(vNormal, arcRadius * Math.cos(rad))
          .add(new THREE.Vector3(0, arcRadius * Math.sin(rad), 0));
        return (
          <group key={tickDeg} position={[tickPos.x, tickPos.y, tickPos.z]}>
            <mesh>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshBasicMaterial color="#fbbf24" />
            </mesh>
            <Text
              fontSize={0.25}
              color="#fbbf24"
              anchorX="center"
              anchorY="bottom"
              position={[0, 0.12, 0]}
            >
              {`${tickDeg}°`}
            </Text>
          </group>
        );
      })}

      {/* Interactive Pitch Grab Bead */}
      <group
        position={[pitchBeadPos.x, pitchBeadPos.y, pitchBeadPos.z]}
        onPointerDown={handlePitchPointerDown}
      >
        {/* Outer glowing halo */}
        <mesh>
          <sphereGeometry args={[0.34, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.35} />
        </mesh>
        {/* Core Grab Disc */}
        <mesh>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Live Pitch Badge */}
        <Text
          fontSize={0.36}
          color="#fbbf24"
          anchorX="center"
          anchorY="bottom"
          position={[0, 0.45, 0]}
        >
          {`Pitch: ${section.pitchDeg}°`}
        </Text>
      </group>

      {/* 3. Compass Azimuth Ring (Horizontal Sky-Blue Ring) */}
      <Line
        points={azimuthCirclePoints}
        color="#38bdf8"
        lineWidth={2.5}
        transparent
        opacity={0.7}
      />

      {/* Cardinal Direction Ticks on Compass Ring */}
      <Text
        position={[centroid3D.x, BUILDING_EAVE_HEIGHT + 0.12, centroid3D.z - azimuthRadius - 0.4]}
        fontSize={0.4}
        color="#f59e0b"
        rotation={[-Math.PI / 2, 0, 0]}
        anchorX="center"
        anchorY="middle"
      >
        N (0°)
      </Text>
      <Text
        position={[centroid3D.x, BUILDING_EAVE_HEIGHT + 0.12, centroid3D.z + azimuthRadius + 0.4]}
        fontSize={0.4}
        color="#f59e0b"
        rotation={[-Math.PI / 2, 0, 0]}
        anchorX="center"
        anchorY="middle"
      >
        S (180°)
      </Text>
      <Text
        position={[centroid3D.x + azimuthRadius + 0.4, BUILDING_EAVE_HEIGHT + 0.12, centroid3D.z]}
        fontSize={0.4}
        color="#94a3b8"
        rotation={[-Math.PI / 2, 0, 0]}
        anchorX="center"
        anchorY="middle"
      >
        E (90°)
      </Text>
      <Text
        position={[centroid3D.x - azimuthRadius - 0.4, BUILDING_EAVE_HEIGHT + 0.12, centroid3D.z]}
        fontSize={0.4}
        color="#94a3b8"
        rotation={[-Math.PI / 2, 0, 0]}
        anchorX="center"
        anchorY="middle"
      >
        W (270°)
      </Text>

      {/* Interactive Compass Heading Arrow & Bead */}
      <group
        position={[azimuthArrowPos.x, azimuthArrowPos.y, azimuthArrowPos.z]}
        onPointerDown={handleAzimuthPointerDown}
      >
        {/* Heading Halo Disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.42, 24]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Facing Badge */}
        <Text
          fontSize={0.34}
          color="#38bdf8"
          anchorX="center"
          anchorY="bottom"
          position={[0, 0.45, 0]}
        >
          {`Facing: ${section.azimuthDeg}° (${getCardinalLabel(section.azimuthDeg)})`}
        </Text>
      </group>
    </group>
  );
};

/**
 * 3D MOVE GIZMO (PRECISION CAD GROUND TRANSLATION)
 * Provides:
 * 1. Center Planar Disc for Free 2D Dragging
 * 2. East-West / North-South Constrained Translation Axes
 * 3. Live 3D Delta Coordinates Badge
 */
const MoveGizmo3D: React.FC<{
  section: RoofPolygonSection;
  siteCenter: GeoPoint;
  onIsDraggingChange: (isDragging: boolean) => void;
}> = ({ section, siteCenter, onIsDraggingChange }) => {
  const { translateRoofSection } = useSolarMapperStore();
  const { camera, gl } = useThree();

  const [dragDelta, setDragDelta] = useState<{ x: number; y: number } | null>(null);

  const secCentroid = useMemo(
    () => calculateCentroid(section.vertices),
    [section.vertices]
  );
  const secCentroidMeters = useMemo(
    () => projectSinglePointToMeters(secCentroid, siteCenter),
    [secCentroid, siteCenter]
  );

  const centroid3D = useMemo(
    () => new THREE.Vector3(secCentroidMeters.x, BUILDING_EAVE_HEIGHT + 0.1, -secCentroidMeters.y),
    [secCentroidMeters]
  );

  const handlePointerDown = (
    e: ThreeEvent<PointerEvent>,
    axis: 'free' | 'x' | 'z'
  ) => {
    e.stopPropagation();
    onIsDraggingChange(true);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(BUILDING_EAVE_HEIGHT + 0.1));
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
    <group position={[centroid3D.x, centroid3D.y, centroid3D.z]}>
      {/* 1. Center Planar Free 2D Drag Disc */}
      <group onPointerDown={(e) => handlePointerDown(e, 'free')}>
        {/* Outer Cyan Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.75, 32]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
        {/* Inner Ocean Blue Disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 32]} />
          <meshBasicMaterial color="#0284c7" side={THREE.DoubleSide} transparent opacity={0.45} />
        </mesh>
        {/* Crosshair Accent */}
        <Line points={[[-0.4, 0, 0], [0.4, 0, 0]]} color="#ffffff" lineWidth={2} />
        <Line points={[[0, 0, -0.4], [0, 0, 0.4]]} color="#ffffff" lineWidth={2} />
        {/* Text */}
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
        />
      ))}

      {/* Interactive 3D Gizmos on Active Section */}
      {activeSection && activeSection.vertices.length >= 3 && (
        <>
          {activeTool === 'move' ? (
            <MoveGizmo3D
              section={activeSection}
              siteCenter={siteCenter}
              onIsDraggingChange={handleGizmoDragState}
            />
          ) : (
            <RotationGizmo3D
              section={activeSection}
              siteCenter={siteCenter}
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

  const pivotEdge = activeSection ? (activeSection.pivotEdgeIndex ?? 0) : 0;

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
              {/* Tool Mode: Rotate & Tilt (Image 1 Style Gizmo) */}
              <button
                type="button"
                onClick={() => setActive3DTool('hinge')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap flex-shrink-0 ${
                  active3DTool === 'hinge' || active3DTool === 'inspect'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Rotate pitch and azimuth with 3D arc controls"
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
                    title={`Hinge along Side ${idx + 1} (${len.toFixed(1)}m)`}
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
