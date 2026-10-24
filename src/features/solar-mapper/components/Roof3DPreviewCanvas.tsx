// src/features/solar-mapper/components/Roof3DPreviewCanvas.tsx
import React, { useMemo, useState, useRef, useCallback, useEffect, useLayoutEffect, Suspense } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  RotateCw,
  Move,
  Maximize2,
  Layers,
  Map,
  Compass,
} from 'lucide-react';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import {
  calculateCentroid,
  projectSinglePointToMeters,
  projectVerticesToLocalMeters,
  getOuterTiltSides,
} from '../utils/geodesicMath';
import { GeoPoint, RoofPolygonSection, PlacedPanel } from '../types/solarMapper';
import { getDefaultSunHour } from '../utils/solarPhysics';

// Realistic Building Eave Elevation above ground plane in meters
const BUILDING_EAVE_HEIGHT = 4.0;

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

// Convert fractional 24h decimal to 12h AM/PM string
function formatSunTime(hourDecimal: number): string {
  const h = Math.floor(hourDecimal);
  const m = Math.floor((hourDecimal - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${period}`;
}

// Physical Celestial Solar Orbit Parameters
const CELESTIAL_ORBIT_RADIUS = 28;
const PEAK_SOLAR_ELEVATION_RAD = degToRad(72); // Peak solar noon elevation angle (~72° in tropical Philippines)

// Calculate physically true, smooth celestial 3D Sun position from Sunrise (East) -> Solar Noon (South) -> Sunset (West)
function getSunPosition(
  hourDecimal: number,
  radius = CELESTIAL_ORBIT_RADIUS
): THREE.Vector3 {
  const clampedH = Math.max(6.0, Math.min(18.0, hourDecimal));
  const t = (clampedH - 6.0) / 12.0; // 0.0 at 6 AM, 0.5 at 12 PM, 1.0 at 6 PM
  const omega = (t - 0.5) * Math.PI; // -pi/2 (sunrise East) -> 0 (noon South) -> +pi/2 (sunset West)

  // In Three.js: East is +X, West is -X, North is -Z, South is +Z, Up is +Y
  const x = -radius * Math.sin(omega);
  const y = radius * Math.cos(omega) * Math.sin(PEAK_SOLAR_ELEVATION_RAD);
  const z = radius * Math.cos(omega) * Math.cos(PEAK_SOLAR_ELEVATION_RAD);

  return new THREE.Vector3(x, Math.max(0.5, y), z);
}

function getCardinalLabel(azimuthDeg: number): string {
  const normalized = ((azimuthDeg % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'N';
  if (normalized >= 22.5 && normalized < 67.5) return 'NE';
  if (normalized >= 67.5 && normalized < 112.5) return 'E';
  if (normalized >= 112.5 && normalized < 157.5) return 'SE';
  if (normalized >= 157.5 && normalized < 202.5) return 'S';
  if (normalized >= 202.5 && normalized < 247.5) return 'SW';
  if (normalized >= 247.5 && normalized < 292.5) return 'W';
  return 'NW';
}

// High-Performance Instanced Solar Panels Component:
// Condenses up to thousands of solar panels into 3 single GPU draw calls via InstancedMesh,
// providing butter-smooth 60+ FPS navigation even with 1,000+ modules!
const PlacedPanelsInstanced: React.FC<{ panels: PlacedPanel[] }> = React.memo(({ panels }) => {
  const glassRef = useRef<THREE.InstancedMesh>(null);
  const frameRef = useRef<THREE.InstancedMesh>(null);
  const gridRef = useRef<THREE.InstancedMesh>(null);
  const railsRef = useRef<THREE.InstancedMesh>(null);

  const count = panels.length;
  const includeRails = count > 0 && count <= 400;

  useLayoutEffect(() => {
    if (count === 0) return;

    const dummy = new THREE.Object3D();
    const glassMesh = glassRef.current;
    const frameMesh = frameRef.current;
    const gridMesh = gridRef.current;
    const railsMesh = railsRef.current;

    let railIdx = 0;

    for (let i = 0; i < count; i++) {
      const p = panels[i];
      const rad = (p.rotationDeg || 0) * (Math.PI / 180);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      // 1. Anodized Aluminum Outer Frame
      if (frameMesh) {
        dummy.position.set(p.x, p.y, 0.118);
        dummy.rotation.set(0, 0, rad);
        dummy.scale.set(p.widthM + 0.02, p.lengthM + 0.02, 1);
        dummy.updateMatrix();
        frameMesh.setMatrixAt(i, dummy.matrix);
      }

      // 2. Dark Blue Anti-Reflective PV Monocrystalline Glass
      if (glassMesh) {
        dummy.position.set(p.x, p.y, 0.12);
        dummy.rotation.set(0, 0, rad);
        dummy.scale.set(p.widthM, p.lengthM, 1);
        dummy.updateMatrix();
        glassMesh.setMatrixAt(i, dummy.matrix);
      }

      // 3. PV Busbar Grid Accent
      if (gridMesh) {
        dummy.position.set(p.x, p.y, 0.139);
        dummy.rotation.set(0, 0, rad);
        dummy.scale.set(p.widthM * 0.96, p.lengthM * 0.96, 1);
        dummy.updateMatrix();
        gridMesh.setMatrixAt(i, dummy.matrix);
      }

      // 4. Structural Mounting Rails (included for small-to-medium roofs, LOD-culled on large arrays)
      if (includeRails && railsMesh) {
        const offsetBottomX = -sin * (-p.lengthM * 0.25);
        const offsetBottomY = cos * (-p.lengthM * 0.25);
        dummy.position.set(p.x + offsetBottomX, p.y + offsetBottomY, 0.105);
        dummy.rotation.set(0, 0, rad);
        dummy.scale.set(p.widthM * 0.95, 0.04, 0.025);
        dummy.updateMatrix();
        railsMesh.setMatrixAt(railIdx++, dummy.matrix);

        const offsetTopX = -sin * (p.lengthM * 0.25);
        const offsetTopY = cos * (p.lengthM * 0.25);
        dummy.position.set(p.x + offsetTopX, p.y + offsetTopY, 0.105);
        dummy.rotation.set(0, 0, rad);
        dummy.scale.set(p.widthM * 0.95, 0.04, 0.025);
        dummy.updateMatrix();
        railsMesh.setMatrixAt(railIdx++, dummy.matrix);
      }
    }

    if (glassMesh) glassMesh.instanceMatrix.needsUpdate = true;
    if (frameMesh) frameMesh.instanceMatrix.needsUpdate = true;
    if (gridMesh) gridMesh.instanceMatrix.needsUpdate = true;
    if (railsMesh && includeRails) railsMesh.instanceMatrix.needsUpdate = true;
  }, [panels, count, includeRails]);

  if (count === 0) return null;

  return (
    <group key={`instanced-panels-${count}`}>
      {includeRails && (
        <instancedMesh
          ref={railsRef}
          args={[undefined, undefined, count * 2]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </instancedMesh>
      )}

      {/* Aluminum Outer Frame */}
      <instancedMesh
        ref={frameRef}
        args={[undefined, undefined, count]}
      >
        <boxGeometry args={[1, 1, 0.03]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.9} />
      </instancedMesh>

      {/* PV Dark Blue Monocrystalline Glass */}
      <instancedMesh
        ref={glassRef}
        args={[undefined, undefined, count]}
        castShadow={count < 300}
        receiveShadow
      >
        <boxGeometry args={[1, 1, 0.035]} />
        <meshStandardMaterial color="#0f2b48" roughness={0.15} metalness={0.85} />
      </instancedMesh>

      {/* PV Busbar Grid Accent */}
      <instancedMesh
        ref={gridRef}
        args={[undefined, undefined, count]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#1d4ed8" transparent opacity={0.35} wireframe />
      </instancedMesh>
    </group>
  );
});

/**
 * Synchronously computes the exact 3D world position of a roof's surface anchor.
 * Derived directly from section vertices, eave height, pitch, roll, and side heading.
 * Guaranteed 100% immediate synchronization when selecting or clicking any roof section.
 */
export function getRoofAnchorWorldPos(
  section: Pick<
    RoofPolygonSection,
    'vertices' | 'baseHeightMeters' | 'pitchDeg' | 'rollDeg' | 'pivotEdgeIndex'
  >,
  siteCenter: GeoPoint
): THREE.Vector3 {
  const secCentroid = calculateCentroid(section.vertices);
  const secCentroidMeters = projectSinglePointToMeters(secCentroid, siteCenter);
  const centerX = secCentroidMeters.x;
  const centerY = section.baseHeightMeters ?? BUILDING_EAVE_HEIGHT;
  const centerZ = -secCentroidMeters.y;

  let sideAngleRad = 0;
  if (section.vertices.length >= 3) {
    const sides = getOuterTiltSides(section.vertices);
    const pivotIdx = ((section.pivotEdgeIndex ?? 0) % 4 + 4) % 4;
    const pivotSide = sides[pivotIdx] || sides[0];
    const dx = pivotSide.endMeters.x - pivotSide.startMeters.x;
    const dy = pivotSide.endMeters.y - pivotSide.startMeters.y;
    sideAngleRad = Math.atan2(dy, dx);
  }

  const pitchRad = degToRad(section.pitchDeg);
  const rollRad = degToRad(section.rollDeg ?? 0);

  // Surface anchor is offset 0.45m normal to the roof deck plane
  const offset = new THREE.Vector3(0, 0.45, 0);

  // Apply tilt frame rotation: Euler XYZ (pitchRad, 0, rollRad)
  offset.applyEuler(new THREE.Euler(pitchRad, 0, rollRad, 'XYZ'));

  // Align with roof rectangle side orientation: rotate around Y by sideAngleRad
  offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), sideAngleRad);

  return new THREE.Vector3(
    centerX + offset.x,
    centerY + offset.y,
    centerZ + offset.z
  );
}

/**
 * Single 3D Roof Mesh Component.
 * Rotates directly on its center of mass across XYZ axes.
 */
const Roof3DMesh: React.FC<{
  section: RoofPolygonSection;
  siteCenter: GeoPoint;
  isActive: boolean;
  onSelect: () => void;
}> = React.memo(({
  section,
  siteCenter,
  isActive,
  onSelect,
}) => {
  const secCentroid = useMemo(
    () => calculateCentroid(section.vertices),
    [section.vertices]
  );

  const secCentroidMeters = useMemo(
    () => projectSinglePointToMeters(secCentroid, siteCenter),
    [secCentroid, siteCenter]
  );

  // Local 2D vertices centered at (0, 0) relative to its centroid
  const localVertices = useMemo(
    () => projectVerticesToLocalMeters(section.vertices),
    [section.vertices]
  );

  // 2D shape centered at (0, 0) directly matching the 2D satellite map geometry
  const shape = useMemo(() => {
    if (localVertices.length < 3) return null;
    const s = new THREE.Shape();
    s.moveTo(localVertices[0].x, localVertices[0].y);
    for (let i = 1; i < localVertices.length; i++) {
      s.lineTo(localVertices[i].x, localVertices[i].y);
    }
    s.closePath();
    return s;
  }, [localVertices]);

  // Calculate side orientation angle for tilting along the rectangle edge
  const { sideAngleRad } = useMemo(() => {
    if (section.vertices.length < 3) return { sideAngleRad: 0 };
    const sides = getOuterTiltSides(section.vertices);
    const pivotIdx = ((section.pivotEdgeIndex ?? 0) % 4 + 4) % 4;
    const pivotSide = sides[pivotIdx] || sides[0];
    const dx = pivotSide.endMeters.x - pivotSide.startMeters.x;
    const dy = pivotSide.endMeters.y - pivotSide.startMeters.y;
    return { sideAngleRad: Math.atan2(dy, dx) };
  }, [section.vertices, section.pivotEdgeIndex]);

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

  if (!shape) return null;

  // Center position of the roof in Three.js coordinates (+X East, +Y Up, -Z North)
  const centerX = secCentroidMeters.x;
  const centerY = section.baseHeightMeters ?? BUILDING_EAVE_HEIGHT;
  const centerZ = -secCentroidMeters.y;

  const pitchRad = degToRad(section.pitchDeg);
  const rollRad = degToRad(section.rollDeg ?? 0);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
    >
      {/* 1. Root Position at Roof Center in 3D Space */}
      <group position={[centerX, centerY, centerZ]}>
        {/* 2. Side-aligned Tilt Frame:
             - Outer Y-rotation (+sideAngleRad) aligns local X with the rectangle side
             - Middle rotation tilts pitch strictly along the rectangle side and roll along perpendicular side
             - Inner Y-rotation (-sideAngleRad) returns the flat 2D shape to its EXACT world satellite orientation!
             When pitch=0 & roll=0, sideAngleRad - sideAngleRad = 0 (100% matches 2D map)!
        */}
        <group rotation={[0, sideAngleRad, 0]}>
          <group rotation={[pitchRad, 0, rollRad]}>
            <group rotation={[0, -sideAngleRad, 0]}>
              {/* Lay flat on horizontal plane: 2D +x -> +X, 2D +y -> -Z, depth -> +Y */}
              <group rotation={[-Math.PI / 2, 0, 0]}>
                {/* Roof Deck Slab */}
                <mesh receiveShadow castShadow position={[0, 0, -0.07]}>
                  <extrudeGeometry args={[shape, roofExtrudeSettings]} />
                  <meshStandardMaterial
                    color={isActive ? '#e2e8f0' : '#cbd5e1'}
                    roughness={0.65}
                    metalness={0.1}
                  />
                </mesh>

                {/* Glowing Outline on Active Roof Section */}
                {isActive && (
                  <mesh position={[0, 0, 0.075]}>
                    <extrudeGeometry
                      args={[
                        shape,
                        { depth: 0.01, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.01 },
                      ]}
                    />
                    <meshBasicMaterial color="#f59e0b" transparent opacity={0.65} wireframe />
                  </mesh>
                )}

                {/* Photovoltaic Solar Panels Array (High-performance Instanced Rendering) */}
                <PlacedPanelsInstanced panels={section.placedPanels || []} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});

/**
 * DUAL-AXIS INCLINE GIMBAL (Pitch & Roll Controls)
 * Features:
 * - Positioned on TOP of the roof surface, aligned to the traced building edges.
 * - depthTest={false} and renderOrder={995} ensure the rings and reticles stay visible from every viewing angle.
 * - Red Ring: Vertical circle along the roof's eave edge (Pitch Tilt). Rotates with roof rectangle orientation.
 * - Blue Ring: Vertical circle along the roof's rake edge (Roll Tilt). Rotates with roof rectangle orientation.
 * - Moving any reticle UP tilts the roof along that specific side.
 * - Yaw orientation is strictly locked to the 2D traced footprint to preserve roof orientation.
 */
const BlenderRotationDial3D: React.FC<{
  center: THREE.Vector3;
  section: RoofPolygonSection;
  onIsDraggingChange: (isDragging: boolean) => void;
}> = ({ center, section, onIsDraggingChange }) => {
  const { updateRoofSectionConfig } = useSolarMapperStore();
  const { camera, gl } = useThree();

  const [activeAxis, setActiveAxis] = useState<'x' | 'z' | null>(null);
  const [hudText, setHudText] = useState<string | null>(null);

  // Dynamically scale the rotation gimbal relative to the roof section dimensions:
  // - Small residential roofs: comfortable default ring size (~3.2m)
  // - Large commercial roofs: maintains a proportional ~38% span scale relative to the roof,
  //   preventing the gizmo from becoming a microscopic speck on 5,000+ m² buildings!
  const radius = useMemo(() => {
    if (!section.vertices || section.vertices.length < 3) return 3.2;
    const ref = section.vertices[0];
    const pts = section.vertices.map((v) => projectSinglePointToMeters(v, ref));
    let sumX = 0;
    let sumY = 0;
    for (const p of pts) {
      sumX += p.x;
      sumY += p.y;
    }
    const cx = sumX / pts.length;
    const cy = sumY / pts.length;
    let maxDist = 0;
    for (const p of pts) {
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d > maxDist) maxDist = d;
    }
    return Math.max(3.2, Math.min(maxDist * 0.38, 45));
  }, [section.vertices]);

  const tubeRadius = Math.max(0.05, radius * 0.016);
  const activeTubeRadius = Math.max(0.08, radius * 0.025);
  const hitBoxRadius = Math.max(0.35, radius * 0.1);

  const reticleRingInner = Math.max(0.16, radius * 0.048);
  const reticleRingOuter = Math.max(0.26, radius * 0.078);
  const reticleSphereRadius = Math.max(0.14, radius * 0.042);
  const reticleHitRadius = Math.max(0.4, radius * 0.12);

  const centerSphereRadius = Math.max(0.15, radius * 0.045);
  const centerRingInner = Math.max(0.25, radius * 0.075);
  const centerRingOuter = Math.max(0.3, radius * 0.09);

  const hudYOffset = radius + Math.max(0.6, radius * 0.18);
  const hudFontSize = Math.max(0.24, radius * 0.075);

  const { sideAngleRad } = useMemo(() => {
    if (section.vertices.length < 3) return { sideAngleRad: 0 };
    const sides = getOuterTiltSides(section.vertices);
    const pivotIdx = ((section.pivotEdgeIndex ?? 0) % 4 + 4) % 4;
    const pivotSide = sides[pivotIdx] || sides[0];
    const dx = pivotSide.endMeters.x - pivotSide.startMeters.x;
    const dy = pivotSide.endMeters.y - pivotSide.startMeters.y;
    return { sideAngleRad: Math.atan2(dy, dx) };
  }, [section.vertices, section.pivotEdgeIndex]);

  // Helper to project cursor ray onto a ring plane and calculate angle
  const getPointerAngleOnRing = useCallback(
    (clientX: number, clientY: number, axis: 'x' | 'z'): number | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // For Red (Pitch / X) and Blue (Roll / Z) rings:
      // In local coordinates of the roof rectangle sides (rotated by sideAngleRad around Y):
      // Red ring normal is local X (1, 0, 0) aligned with rectangle eave.
      // In world coords: rotated by sideAngleRad around Y -> (cosY, 0, -sinY).
      // Blue ring normal is local Z (0, 0, 1) aligned with perpendicular rectangle rake.
      // In world coords: rotated by sideAngleRad around Y -> (sinY, 0, cosY).
      const cosY = Math.cos(sideAngleRad);
      const sinY = Math.sin(sideAngleRad);

      const normal =
        axis === 'x'
          ? new THREE.Vector3(cosY, 0, -sinY)
          : new THREE.Vector3(sinY, 0, cosY);

      // Check if camera ray is nearly parallel to plane normal (edge-on view fallback)
      const dot = Math.abs(raycaster.ray.direction.dot(normal));
      let plane: THREE.Plane;
      if (dot < 0.08) {
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir.negate(), center);
      } else {
        plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, center);
      }

      const hit = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(plane, hit)) return null;

      // Vector from center in world coordinates
      const vWorldX = hit.x - center.x;
      const vWorldY = hit.y - center.y;
      const vWorldZ = hit.z - center.z;

      // Convert world vector to local heading coordinates by rotating by -sideAngleRad around Y:
      const vLocalX = vWorldX * cosY - vWorldZ * sinY;
      const vLocalY = vWorldY;
      const vLocalZ = vWorldX * sinY + vWorldZ * cosY;

      if (axis === 'x') {
        // Pitch: in local Y-Z plane (vLocalY is Up, -vLocalZ is Up-Slope towards ridge)
        return radToDeg(Math.atan2(vLocalY, -vLocalZ));
      }
      if (axis === 'z') {
        // Roll: in local X-Y plane
        return radToDeg(Math.atan2(vLocalY, vLocalX));
      }
      return null;
    },
    [camera, center, gl, sideAngleRad]
  );

  // Interactive Drag for Red X-Axis Ring (Pitch Tilt)
  const handleXPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onIsDraggingChange(true);
    setActiveAxis('x');

    const startAngle = getPointerAngleOnRing(e.clientX, e.clientY, 'x') ?? section.pitchDeg;
    const startPitch = section.pitchDeg;

    const onPointerMove = (evt: PointerEvent) => {
      const currentAngle = getPointerAngleOnRing(evt.clientX, evt.clientY, 'x');
      if (currentAngle === null) return;

      let delta = currentAngle - startAngle;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;

      const newPitch = Math.max(-60, Math.min(60, Math.round(startPitch + delta)));
      updateRoofSectionConfig(section.id, { pitchDeg: newPitch });
      setHudText(`Pitch (Red): ${newPitch}°`);
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

  // Interactive Drag for Blue Z-Axis Ring (Roll Tilt)
  const handleZPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onIsDraggingChange(true);
    setActiveAxis('z');

    const startAngle = getPointerAngleOnRing(e.clientX, e.clientY, 'z') ?? (section.rollDeg ?? 0);
    const startRoll = section.rollDeg ?? 0;

    const onPointerMove = (evt: PointerEvent) => {
      const currentAngle = getPointerAngleOnRing(evt.clientX, evt.clientY, 'z');
      if (currentAngle === null) return;

      let delta = currentAngle - startAngle;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;

      const newRoll = Math.max(-60, Math.min(60, Math.round(startRoll + delta)));
      updateRoofSectionConfig(section.id, { rollDeg: newRoll });
      setHudText(`Roll (Blue): ${newRoll}°`);
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

  // 1. Red Dot in Local Heading Space (Follows pitch angle along the slope)
  const xRad = degToRad(section.pitchDeg);
  const xReticlePos: [number, number, number] = [
    0,
    radius * Math.sin(xRad),
    -radius * Math.cos(xRad),
  ];

  // 2. Blue Dot in Local Heading Space (Follows roll angle along the width)
  const zRad = degToRad(section.rollDeg ?? 0);
  const zReticlePos: [number, number, number] = [
    radius * Math.cos(zRad),
    radius * Math.sin(zRad),
    0,
  ];

  return (
    <group position={[center.x, center.y, center.z]}>
      {/* Center Pivot Reticle (Always on top) */}
      <group renderOrder={999}>
        <mesh renderOrder={999}>
          <sphereGeometry args={[centerSphereRadius, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" depthTest={false} depthWrite={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={999}>
          <ringGeometry args={[centerRingInner, centerRingOuter, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            side={THREE.DoubleSide}
            transparent
            opacity={0.7}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* LOCAL ORIENTATION GROUP: PITCH & ROLL RINGS ROTATE WITH RECTANGLE SIDES */}
      <group rotation={[0, sideAngleRad, 0]} renderOrder={995}>
        {/* RED RING (X-AXIS / PITCH TILT ALONG SLOPE - Always on top) */}
        <group renderOrder={995}>
          <mesh rotation={[0, Math.PI / 2, 0]} renderOrder={995} onPointerDown={handleXPointerDown}>
            <torusGeometry args={[radius, activeAxis === 'x' ? activeTubeRadius : tubeRadius, 16, 64]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#b91c1c"
              emissiveIntensity={activeAxis === 'x' ? 1.4 : 0.65}
              roughness={0.2}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]} onPointerDown={handleXPointerDown}>
            <torusGeometry args={[radius, hitBoxRadius, 8, 32]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          {/* Grab Reticle Dot on Red Ring */}
          <group position={xReticlePos} renderOrder={999} onPointerDown={handleXPointerDown}>
            <mesh rotation={[0, Math.PI / 2, 0]} renderOrder={999}>
              <ringGeometry args={[reticleRingInner, reticleRingOuter, 24]} />
              <meshBasicMaterial
                color="#ffffff"
                side={THREE.DoubleSide}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
            <mesh renderOrder={999}>
              <sphereGeometry args={[reticleSphereRadius, 16, 16]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#dc2626"
                emissiveIntensity={activeAxis === 'x' ? 1.6 : 0.8}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[reticleHitRadius, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          </group>
        </group>

        {/* BLUE RING (Z-AXIS / ROLL TILT ALONG WIDTH - Always on top) */}
        <group renderOrder={995}>
          <mesh rotation={[0, 0, 0]} renderOrder={995} onPointerDown={handleZPointerDown}>
            <torusGeometry args={[radius, activeAxis === 'z' ? activeTubeRadius : tubeRadius, 16, 64]} />
            <meshStandardMaterial
              color="#3b82f6"
              emissive="#1d4ed8"
              emissiveIntensity={activeAxis === 'z' ? 1.4 : 0.65}
              roughness={0.2}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation={[0, 0, 0]} onPointerDown={handleZPointerDown}>
            <torusGeometry args={[radius, hitBoxRadius, 8, 32]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          {/* Grab Reticle Dot on Blue Ring */}
          <group position={zReticlePos} renderOrder={999} onPointerDown={handleZPointerDown}>
            <mesh rotation={[0, 0, 0]} renderOrder={999}>
              <ringGeometry args={[reticleRingInner, reticleRingOuter, 24]} />
              <meshBasicMaterial
                color="#ffffff"
                side={THREE.DoubleSide}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
            <mesh renderOrder={999}>
              <sphereGeometry args={[reticleSphereRadius, 16, 16]} />
              <meshStandardMaterial
                color="#3b82f6"
                emissive="#2563eb"
                emissiveIntensity={activeAxis === 'z' ? 1.6 : 0.8}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[reticleHitRadius, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Live Floating HUD Badge while dragging */}
      {hudText && (
        <group position={[0, hudYOffset, 0]} renderOrder={1000}>
          <mesh renderOrder={1000}>
            <planeGeometry args={[hudText.length * hudFontSize * 0.65 + hudFontSize * 2, hudFontSize * 2.2]} />
            <meshBasicMaterial
              color="#020617"
              transparent
              opacity={0.88}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
          <Text
            fontSize={hudFontSize}
            color="#f8fafc"
            anchorX="center"
            anchorY="middle"
            renderOrder={1001}
          >
            {hudText}
          </Text>
        </group>
      )}
    </group>
  );
};

/**
 * Helper to compute an optimal raycast projection plane for an axis that directly faces the camera.
 * Guarantees zero-jitter, 1:1 cursor-following motion across all viewing angles.
 */
function getAxisPlane(axisUnit: THREE.Vector3, center: THREE.Vector3, camera: THREE.Camera): THREE.Plane {
  const vCam = new THREE.Vector3().subVectors(camera.position, center);
  let w = new THREE.Vector3().crossVectors(axisUnit, vCam);
  if (w.lengthSq() < 1e-4) {
    w = new THREE.Vector3().crossVectors(axisUnit, new THREE.Vector3(0, 1, 0));
    if (w.lengthSq() < 1e-4) {
      w = new THREE.Vector3().crossVectors(axisUnit, new THREE.Vector3(1, 0, 0));
    }
  }
  const normal = new THREE.Vector3().crossVectors(w, axisUnit).normalize();
  return new THREE.Plane().setFromNormalAndCoplanarPoint(normal, center);
}

/**
 * 3-AXIS XYZ TRANSLATION GIZMO (Precision CAD Coordinate Arrows)
 * Matches reference CAD design:
 * - Red Arrow (+X Axis): East-West horizontal translation
 * - Green Arrow (+Y Axis): Vertical elevation adjustment
 * - Blue Arrow (+Z Axis): North-South depth translation
 * - Center Origin Sphere & XZ Corner Quad: Free 2D planar translation
 * - Always On Top: depthTest={false}, depthWrite={false}, and renderOrder={995..1001}
 *   ensure all arrows, shafts, heads, and labels remain fully visible on top of roof slabs and panels.
 */
const MoveGizmo3D: React.FC<{
  center: THREE.Vector3;
  section: RoofPolygonSection;
  onIsDraggingChange: (isDragging: boolean) => void;
}> = ({ center, section, onIsDraggingChange }) => {
  const { translateRoofSection, updateRoofSectionConfig } = useSolarMapperStore();
  const { camera, gl } = useThree();

  const [activeAxis, setActiveAxis] = useState<'x' | 'y' | 'z' | 'xz' | 'free' | null>(null);
  const [hudText, setHudText] = useState<string | null>(null);

  // Proportional scale factor for translation arrows on large roofs
  const scaleFactor = useMemo(() => {
    if (!section.vertices || section.vertices.length < 3) return 1;
    const ref = section.vertices[0];
    const pts = section.vertices.map((v) => projectSinglePointToMeters(v, ref));
    let sumX = 0;
    let sumY = 0;
    for (const p of pts) {
      sumX += p.x;
      sumY += p.y;
    }
    const cx = sumX / pts.length;
    const cy = sumY / pts.length;
    let maxDist = 0;
    for (const p of pts) {
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d > maxDist) maxDist = d;
    }
    return Math.max(1, Math.min(maxDist / 7.5, 12));
  }, [section.vertices]);

  const shaftLength = 2.4 * scaleFactor;
  const shaftRadius = 0.045 * scaleFactor;
  const coneHeight = 0.55 * scaleFactor;
  const coneRadius = 0.16 * scaleFactor;
  const hitRadius = 0.35 * scaleFactor;
  const cornerQuadOffset = 0.7 * scaleFactor;
  const cornerQuadSize = 0.75 * scaleFactor;
  const cornerQuadHalf = cornerQuadSize / 2;
  const centerSphereRadius = 0.15 * scaleFactor;
  const centerRingInner = 0.2 * scaleFactor;
  const centerRingOuter = 0.28 * scaleFactor;
  const centerHitRadius = 0.45 * scaleFactor;
  const labelFontSize = 0.36 * scaleFactor;
  const labelOffset = shaftLength + coneHeight + 0.45 * scaleFactor;
  const hudYOffset = shaftLength + coneHeight + 1.2 * scaleFactor;
  const hudFontSize = 0.24 * scaleFactor;

  const handlePointerDown = (
    e: ThreeEvent<PointerEvent>,
    axis: 'x' | 'y' | 'z' | 'xz' | 'free'
  ) => {
    e.stopPropagation();
    onIsDraggingChange(true);
    setActiveAxis(axis);

    const frozenCenter = center.clone();
    const raycaster = new THREE.Raycaster();

    const getRay = (clientX: number, clientY: number): THREE.Ray => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      return raycaster.ray;
    };

    let plane: THREE.Plane;
    let axisUnit: THREE.Vector3 | null = null;

    if (axis === 'x') {
      axisUnit = new THREE.Vector3(1, 0, 0);
      plane = getAxisPlane(axisUnit, frozenCenter, camera);
    } else if (axis === 'y') {
      axisUnit = new THREE.Vector3(0, 1, 0);
      plane = getAxisPlane(axisUnit, frozenCenter, camera);
    } else if (axis === 'z') {
      axisUnit = new THREE.Vector3(0, 0, 1);
      plane = getAxisPlane(axisUnit, frozenCenter, camera);
    } else {
      // 'xz' or 'free': horizontal ground plane through frozenCenter.y
      plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -frozenCenter.y);
    }

    const getHitPoint = (clientX: number, clientY: number): THREE.Vector3 | null => {
      const ray = getRay(clientX, clientY);
      const target = new THREE.Vector3();
      return ray.intersectPlane(plane, target);
    };

    let lastHit = getHitPoint(e.clientX, e.clientY);
    let lastProj = axisUnit && lastHit ? new THREE.Vector3().subVectors(lastHit, frozenCenter).dot(axisUnit) : 0;
    let accumX = 0;
    let accumY = 0;
    let accumZ = 0;
    const initialHeight = section.baseHeightMeters ?? BUILDING_EAVE_HEIGHT;

    const onPointerMove = (evt: PointerEvent) => {
      const currentHit = getHitPoint(evt.clientX, evt.clientY);
      if (!currentHit) return;

      if (axisUnit) {
        const currentProj = new THREE.Vector3().subVectors(currentHit, frozenCenter).dot(axisUnit);
        const delta = currentProj - lastProj;

        if (Math.abs(delta) >= 0.03) {
          if (axis === 'x') {
            // East-West (+X is East)
            translateRoofSection(section.id, delta, 0);
            accumX += delta;
            setHudText(`X (East/West): ${accumX >= 0 ? '+' : ''}${accumX.toFixed(2)}m`);
          } else if (axis === 'z') {
            // North-South (+Z is South, so geo latitude delta is -delta)
            const deltaGeoY = -delta;
            translateRoofSection(section.id, 0, deltaGeoY);
            accumZ += delta;
            setHudText(`Z (North/South): ${-accumZ >= 0 ? '+' : ''}${-accumZ.toFixed(2)}m`);
          } else if (axis === 'y') {
            // Vertical elevation
            accumY += delta;
            const newHeight = Math.max(0.5, Math.min(35.0, Math.round((initialHeight + accumY) * 10) / 10));
            updateRoofSectionConfig(section.id, { baseHeightMeters: newHeight });
            setHudText(`Elevation (Y): ${newHeight.toFixed(1)}m (${accumY >= 0 ? '+' : ''}${accumY.toFixed(1)}m)`);
          }
          lastProj = currentProj;
        }
      } else {
        if (!lastHit) return;
        const dx = currentHit.x - lastHit.x;
        const dz = currentHit.z - lastHit.z;
        const deltaGeoX = dx;
        const deltaGeoY = -dz;

        if (Math.hypot(dx, dz) >= 0.03) {
          translateRoofSection(section.id, deltaGeoX, deltaGeoY);
          accumX += deltaGeoX;
          accumZ += deltaGeoY;
          setHudText(`Δ East: ${accumX >= 0 ? '+' : ''}${accumX.toFixed(1)}m, North: ${accumZ >= 0 ? '+' : ''}${accumZ.toFixed(1)}m`);
          lastHit = currentHit;
        }
      }
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

  return (
    <group position={[center.x, center.y, center.z]} renderOrder={995}>
      {/* 1. RED ARROW (+X AXIS: EAST - WEST) */}
      <group renderOrder={995}>
        {/* Shaft */}
        <mesh
          position={[shaftLength / 2, 0, 0]}
          rotation={[0, 0, -Math.PI / 2]}
          renderOrder={995}
          onPointerDown={(e) => handlePointerDown(e, 'x')}
        >
          <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 16]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#b91c1c"
            emissiveIntensity={activeAxis === 'x' ? 1.6 : 0.7}
            roughness={0.25}
            metalness={0.4}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Conical Arrowhead */}
        <mesh
          position={[shaftLength + coneHeight / 2, 0, 0]}
          rotation={[0, 0, -Math.PI / 2]}
          renderOrder={995}
          onPointerDown={(e) => handlePointerDown(e, 'x')}
        >
          <coneGeometry args={[coneRadius, coneHeight, 24]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#dc2626"
            emissiveIntensity={activeAxis === 'x' ? 1.8 : 0.8}
            roughness={0.2}
            metalness={0.4}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Generous Invisible Hit Box */}
        <mesh
          position={[shaftLength / 2 + 0.2 * scaleFactor, 0, 0]}
          rotation={[0, 0, -Math.PI / 2]}
          onPointerDown={(e) => handlePointerDown(e, 'x')}
        >
          <cylinderGeometry args={[hitRadius, hitRadius, shaftLength + coneHeight + 0.4 * scaleFactor, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Axis Label */}
        <Text
          position={[labelOffset, 0, 0]}
          fontSize={labelFontSize}
          color="#fca5a5"
          anchorX="center"
          anchorY="middle"
          renderOrder={999}
        >
          X
        </Text>
      </group>

      {/* 2. GREEN ARROW (+Y AXIS: VERTICAL ELEVATION) */}
      <group renderOrder={995}>
        {/* Shaft */}
        <mesh
          position={[0, shaftLength / 2, 0]}
          renderOrder={995}
          onPointerDown={(e) => handlePointerDown(e, 'y')}
        >
          <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 16]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#15803d"
            emissiveIntensity={activeAxis === 'y' ? 1.6 : 0.7}
            roughness={0.25}
            metalness={0.4}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Conical Arrowhead */}
        <mesh
          position={[0, shaftLength + coneHeight / 2, 0]}
          renderOrder={995}
          onPointerDown={(e) => handlePointerDown(e, 'y')}
        >
          <coneGeometry args={[coneRadius, coneHeight, 24]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#16a34a"
            emissiveIntensity={activeAxis === 'y' ? 1.8 : 0.8}
            roughness={0.2}
            metalness={0.4}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Generous Invisible Hit Box */}
        <mesh
          position={[0, shaftLength / 2 + 0.2 * scaleFactor, 0]}
          onPointerDown={(e) => handlePointerDown(e, 'y')}
        >
          <cylinderGeometry args={[hitRadius, hitRadius, shaftLength + coneHeight + 0.4 * scaleFactor, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Axis Label */}
        <Text
          position={[0, labelOffset, 0]}
          fontSize={labelFontSize}
          color="#86efac"
          anchorX="center"
          anchorY="middle"
          renderOrder={999}
        >
          Y
        </Text>
      </group>

      {/* 3. BLUE ARROW (+Z AXIS: NORTH - SOUTH) */}
      <group renderOrder={995}>
        {/* Shaft */}
        <mesh
          position={[0, 0, shaftLength / 2]}
          rotation={[Math.PI / 2, 0, 0]}
          renderOrder={995}
          onPointerDown={(e) => handlePointerDown(e, 'z')}
        >
          <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 16]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#1d4ed8"
            emissiveIntensity={activeAxis === 'z' ? 1.6 : 0.7}
            roughness={0.25}
            metalness={0.4}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Conical Arrowhead */}
        <mesh
          position={[0, 0, shaftLength + coneHeight / 2]}
          rotation={[Math.PI / 2, 0, 0]}
          renderOrder={995}
          onPointerDown={(e) => handlePointerDown(e, 'z')}
        >
          <coneGeometry args={[coneRadius, coneHeight, 24]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#2563eb"
            emissiveIntensity={activeAxis === 'z' ? 1.8 : 0.8}
            roughness={0.2}
            metalness={0.4}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {/* Generous Invisible Hit Box */}
        <mesh
          position={[0, 0, shaftLength / 2 + 0.2 * scaleFactor]}
          rotation={[Math.PI / 2, 0, 0]}
          onPointerDown={(e) => handlePointerDown(e, 'z')}
        >
          <cylinderGeometry args={[hitRadius, hitRadius, shaftLength + coneHeight + 0.4 * scaleFactor, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Axis Label */}
        <Text
          position={[0, 0, labelOffset]}
          fontSize={labelFontSize}
          color="#93c5fd"
          anchorX="center"
          anchorY="middle"
          renderOrder={999}
        >
          Z
        </Text>
      </group>

      {/* 4. XZ GROUND PLANE CORNER HANDLE (Free horizontal translation between X & Z) */}
      <group position={[cornerQuadOffset, 0, cornerQuadOffset]} renderOrder={996}>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={996}
          onPointerDown={(e) => handlePointerDown(e, 'xz')}
        >
          <planeGeometry args={[cornerQuadSize, cornerQuadSize]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={activeAxis === 'xz' ? 1.4 : 0.4}
            transparent
            opacity={activeAxis === 'xz' ? 0.65 : 0.28}
            side={THREE.DoubleSide}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        <Line
          points={[
            [-cornerQuadHalf, 0, cornerQuadHalf],
            [cornerQuadHalf, 0, cornerQuadHalf],
            [cornerQuadHalf, 0, -cornerQuadHalf],
          ]}
          color="#38bdf8"
          lineWidth={2}
          depthTest={false}
        />
      </group>

      {/* 5. CENTER ORIGIN SPHERE (Free 2D Translation) */}
      <group renderOrder={998} onPointerDown={(e) => handlePointerDown(e, 'free')}>
        <mesh renderOrder={998}>
          <sphereGeometry args={[centerSphereRadius, 20, 20]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#38bdf8"
            emissiveIntensity={activeAxis === 'free' ? 1.8 : 0.9}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={998}>
          <ringGeometry args={[centerRingInner, centerRingOuter, 24]} />
          <meshBasicMaterial
            color="#38bdf8"
            side={THREE.DoubleSide}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[centerHitRadius, 12, 12]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>

      {/* 6. LIVE DELTA READOUT HUD BADGE (Elevated in scene) */}
      {hudText && (
        <group position={[0, hudYOffset, 0]} renderOrder={1000}>
          <mesh renderOrder={1000}>
            <planeGeometry args={[hudText.length * hudFontSize * 0.65 + hudFontSize * 2, hudFontSize * 2.2]} />
            <meshBasicMaterial
              color="#020617"
              transparent
              opacity={0.88}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
          <Text
            fontSize={hudFontSize}
            color="#f8fafc"
            anchorX="center"
            anchorY="middle"
            renderOrder={1001}
          >
            {hudText}
          </Text>
        </group>
      )}
    </group>
  );
};

// Celestial Diurnal Sun Path Arc in the Sky (True East-to-West Celestial Circle)
const CelestialSunArc: React.FC<{ radius: number }> = ({ radius }) => {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    // Smoothly sample the celestial diurnal circle from 6:00 AM to 6:00 PM
    for (let h = 6.0; h <= 18.0; h += 0.1) {
      const p = getSunPosition(h, radius);
      pts.push([p.x, p.y, p.z]);
    }
    return pts;
  }, [radius]);

  // Solar Milestone Waypoints on the Celestial Orbit
  const milestoneHours = useMemo(
    () => [
      { h: 6.0, label: '6 AM (East)' },
      { h: 9.0, label: '9 AM' },
      { h: 12.0, label: '12 PM (South)' },
      { h: 15.0, label: '3 PM' },
      { h: 18.0, label: '6 PM (West)' },
    ],
    []
  );

  const markerSphereRadius = Math.max(0.22, radius * 0.007);
  const markerFontSize = Math.max(0.55, radius * 0.018);
  const markerTextY = Math.max(0.65, radius * 0.022);

  return (
    <group>
      {/* Outer Luminous Golden Aura Path */}
      <Line
        points={points}
        color="#fbbf24"
        lineWidth={3.5}
        transparent
        opacity={0.25}
      />
      {/* Core Precision Celestial Arc */}
      <Line
        points={points}
        color="#f59e0b"
        lineWidth={1.5}
        transparent
        opacity={0.7}
      />

      {/* Solar Milestone Nodes on the Celestial Arc */}
      {milestoneHours.map(({ h, label }) => {
        const pos = getSunPosition(h, radius);
        return (
          <group key={h} position={[pos.x, pos.y, pos.z]}>
            <mesh>
              <sphereGeometry args={[markerSphereRadius, 16, 16]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.7} />
            </mesh>
            <Text
              position={[0, markerTextY, 0]}
              fontSize={markerFontSize}
              color="#fef08a"
              anchorX="center"
              anchorY="bottom"
            >
              {label}
            </Text>
          </group>
        );
      })}
    </group>
  );
};

// Automatic Camera Auto-framer: guarantees the roofs are always perfectly framed on stage on initial load
const CameraFramer: React.FC<{ maxDistMeters: number }> = ({ maxDistMeters }) => {
  const { camera } = useThree();
  const hasFramedRef = useRef(false);

  useEffect(() => {
    if (!hasFramedRef.current) {
      hasFramedRef.current = true;
      const targetDist = Math.max(30, maxDistMeters * 2.2);
      camera.position.set(targetDist * 0.44, targetDist * 0.55, targetDist * 0.72);
      camera.lookAt(0, BUILDING_EAVE_HEIGHT, 0);
      camera.updateProjectionMatrix();
    }
  }, [maxDistMeters, camera]);

  return null;
};

// Sunlight Guide Ray from Sun to Active Roof Center
const SunlightRay: React.FC<{ sunPos: THREE.Vector3; targetPos: THREE.Vector3 }> = ({
  sunPos,
  targetPos,
}) => {
  const points: [number, number, number][] = useMemo(
    () => [
      [sunPos.x, sunPos.y, sunPos.z],
      [targetPos.x, targetPos.y, targetPos.z],
    ],
    [sunPos.x, sunPos.y, sunPos.z, targetPos.x, targetPos.y, targetPos.z]
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

  // Filter for valid roofs with >= 3 vertices that physically exist in 3D
  const validSections = useMemo(
    () => roofSections.filter((s) => s.vertices.length >= 3),
    [roofSections]
  );

  // Stable 3D Coordinate Origin:
  // Derived directly from the centroid of the traced roof polygons.
  // Re-centers whenever the number of valid roofs changes or if roofs are moved far away (e.g. map pan to a new city),
  // guaranteeing the roofs are ALWAYS 100% centered on stage at (0, 0, 0)!
  const stableOriginRef = useRef<GeoPoint | null>(null);
  const prevSectionsCountRef = useRef<number>(-1);

  const siteCenter = useMemo(() => {
    if (validSections.length > 0) {
      const allVertices = validSections.flatMap((s) => s.vertices);
      const centroid = calculateCentroid(allVertices);
      if (!stableOriginRef.current || prevSectionsCountRef.current !== validSections.length) {
        prevSectionsCountRef.current = validSections.length;
        stableOriginRef.current = centroid;
      } else {
        const offset = projectSinglePointToMeters(centroid, stableOriginRef.current);
        if (Math.hypot(offset.x, offset.y) > 40) {
          stableOriginRef.current = centroid;
        }
      }
      return stableOriginRef.current;
    }
    return coordinates;
  }, [validSections, coordinates]);

  // Stage & Sun Dynamic Scaling:
  // No matter the size of the roofs (small residential or massive commercial warehouse),
  // the stage grid and celestial sun arc are ALWAYS scaled comfortably larger than the roofs!
  const { stageGridSize, celestialOrbitRadius, maxDistMeters } = useMemo(() => {
    if (validSections.length === 0) {
      return { stageGridSize: 50, celestialOrbitRadius: 32, maxDistMeters: 12 };
    }

    let maxDist = 12;
    validSections.forEach((sec) => {
      sec.vertices.forEach((v) => {
        const pt = projectSinglePointToMeters(v, siteCenter);
        const dist = Math.hypot(pt.x, pt.y);
        if (dist > maxDist) maxDist = dist;
      });
    });

    const gridSize = Math.max(50, Math.ceil((maxDist * 2.6) / 10) * 10);
    const orbitRadius = Math.max(32, Math.ceil(maxDist * 1.85));

    return { stageGridSize: gridSize, celestialOrbitRadius: orbitRadius, maxDistMeters: maxDist };
  }, [validSections, siteCenter]);

  const gridDivisions = useMemo(() => {
    return Math.min(100, Math.max(40, Math.round(stageGridSize / 1.5)));
  }, [stageGridSize]);

  const cardinalOffset = stageGridSize * 0.44;
  const cardinalFontSize = Math.max(1.1, stageGridSize * 0.03);

  const sunPos = useMemo(
    () => getSunPosition(sunHour, celestialOrbitRadius),
    [sunHour, celestialOrbitRadius]
  );

  const sunLightColor = useMemo(() => {
    if (sunHour < 7.5 || sunHour > 16.5) return '#fed7aa';
    if (sunHour < 9.5 || sunHour > 14.5) return '#fef08a';
    return '#ffffff';
  }, [sunHour]);

  const activeSection = activeSectionId
    ? roofSections.find((s) => s.id === activeSectionId) || null
    : null;

  // Immediate, synchronous world anchor for active roof gizmos and celestial sunlight guide ray.
  // Re-evaluates instantly whenever the active roof changes, with zero frame lag or stale state!
  const activeRoofWorldCenter = useMemo(() => {
    if (!activeSection || activeSection.vertices.length < 3) {
      return new THREE.Vector3(0, BUILDING_EAVE_HEIGHT + 0.5, 0);
    }
    return getRoofAnchorWorldPos(activeSection, siteCenter);
  }, [activeSection, siteCenter]);

  const groundDownPosRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <>
      <CameraFramer maxDistMeters={maxDistMeters} />
      <ambientLight intensity={0.55} color="#cbd5e1" />
      <directionalLight
        position={[sunPos.x, sunPos.y, sunPos.z]}
        intensity={2.0}
        color={sunLightColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={celestialOrbitRadius * 3}
        shadow-camera-left={-celestialOrbitRadius * 0.9}
        shadow-camera-right={celestialOrbitRadius * 0.9}
        shadow-camera-top={celestialOrbitRadius * 0.9}
        shadow-camera-bottom={-celestialOrbitRadius * 0.9}
        shadow-bias={-0.0002}
      />

      {/* Sun Sphere & Corona */}
      <group position={[sunPos.x, sunPos.y, sunPos.z]}>
        <mesh>
          <sphereGeometry args={[Math.max(1.2, celestialOrbitRadius * 0.038), 32, 32]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        <mesh>
          <sphereGeometry args={[Math.max(1.8, celestialOrbitRadius * 0.057), 24, 24]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.4} />
        </mesh>
        <mesh>
          <sphereGeometry args={[Math.max(2.8, celestialOrbitRadius * 0.088), 24, 24]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.15} />
        </mesh>
        <Text
          position={[0, Math.max(2.2, celestialOrbitRadius * 0.07), 0]}
          fontSize={Math.max(0.85, celestialOrbitRadius * 0.027)}
          color="#fef08a"
          anchorX="center"
          anchorY="bottom"
        >
          {formatSunTime(sunHour)}
        </Text>
      </group>

      {/* Celestial Sun Transit Arc */}
      <CelestialSunArc radius={celestialOrbitRadius} />

      {/* Sunlight Ray (Active Roof) */}
      {activeSection && (
        <SunlightRay sunPos={sunPos} targetPos={activeRoofWorldCenter} />
      )}

      {/* Ground Reference Plane with Grid */}
      <gridHelper
        args={[stageGridSize, gridDivisions, '#475569', '#1e293b']}
        position={[0, -0.02, 0]}
      />

      {/* Ground Shadow & Click Deselect Receiver */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.04, 0]}
        receiveShadow
        onPointerDown={(e) => {
          groundDownPosRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          if (groundDownPosRef.current) {
            const dist = Math.hypot(
              e.clientX - groundDownPosRef.current.x,
              e.clientY - groundDownPosRef.current.y
            );
            groundDownPosRef.current = null;
            if (dist <= 6) {
              setActiveSectionId(null);
            }
          }
        }}
      >
        <planeGeometry args={[stageGridSize * 3, stageGridSize * 3]} />
        <shadowMaterial opacity={0.4} />
      </mesh>

      {/* Cardinal Direction Markers on the Ground */}
      <Text
        position={[0, 0.05, -cardinalOffset]}
        fontSize={cardinalFontSize}
        color="#f59e0b"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        N (0°)
      </Text>
      <Text
        position={[0, 0.05, cardinalOffset]}
        fontSize={cardinalFontSize}
        color="#f59e0b"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        S (180°)
      </Text>
      <Text
        position={[cardinalOffset, 0.05, 0]}
        fontSize={cardinalFontSize}
        color="#94a3b8"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        E (90°)
      </Text>
      <Text
        position={[-cardinalOffset, 0.05, 0]}
        fontSize={cardinalFontSize}
        color="#94a3b8"
        rotation={[-Math.PI / 2, 0, 0]}
      >
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
        />
      ))}

      {/* 3D GIZMOS MOUNTED AT THE ELEVATED TOP SURFACE OF THE ROOF */}
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
        minDistance={Math.max(4, maxDistMeters * 0.25)}
        maxDistance={Math.max(90, maxDistMeters * 6.0)}
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
    setActiveSectionId,
    active3DTool,
    setActive3DTool,
    updateRoofSectionConfig,
    translateRoofSection,
  } = useSolarMapperStore();

  const [, setIsDraggingRoof] = useState(false);
  const canvasPointerDownRef = useRef<{ x: number; y: number } | null>(null);

  // Set sun simulation by default to user's current local time upon mounting 3D view
  useEffect(() => {
    setSunHour(getDefaultSunHour());
  }, [setSunHour]);

  const activeSection = activeSectionId
    ? roofSections.find((s) => s.id === activeSectionId) || null
    : null;

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    canvasPointerDownRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasPointerMissed = (e: MouseEvent) => {
    if (canvasPointerDownRef.current) {
      const dist = Math.hypot(
        e.clientX - canvasPointerDownRef.current.x,
        e.clientY - canvasPointerDownRef.current.y
      );
      if (dist > 6) {
        // User was orbiting/panning the camera
        return;
      }
    }
    setActiveSectionId(null);
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
            dpr={[1, 1.5]}
            gl={{ powerPreference: 'high-performance', antialias: true }}
            camera={{ position: [16, 20, 26], fov: 46 }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onPointerDown={handleCanvasPointerDown}
            onPointerMissed={handleCanvasPointerMissed}
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
              {activeSection.pitchDeg === 0 ? 'Flat (0°)' : `${activeSection.pitchDeg}° Pitch`} • {`${activeSection.azimuthDeg}° ${getCardinalLabel(activeSection.azimuthDeg)}`}
            </span>
          </div>
        )}

        {/* Subtle Pill when roofs exist but none is currently selected */}
        {!activeSection && roofSections.length > 0 && roofSections.some((s) => s.vertices.length >= 3) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="px-4 py-1.5 rounded-full bg-slate-950/80 border border-white/10 text-slate-300 text-xs backdrop-blur-md shadow-md flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Click any roof to select &amp; adjust in 3D</span>
            </div>
          </div>
        )}

        {/* Empty State Banner if no roof has been drawn */}
        {(roofSections.length === 0 || roofSections.every((s) => s.vertices.length < 3)) && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs z-10 p-6 text-center">
            <div className="max-w-md p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-3">
              <Layers className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Roof Polygons Traced Yet</h4>
              <p className="text-xs text-slate-400">
                Trace your roof corners on the satellite map to inspect the 3D model and packed solar array.
              </p>
              <div className="flex items-center justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('2d_satellite')}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-sm"
                >
                  Return to Satellite
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOP-CENTER FLOATING STUDIO CONTROLS DOCK */}
        {activeSection && activeSection.vertices.length >= 3 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-[calc(100%-2rem)] overflow-x-auto no-scrollbar">
            <div className="p-1.5 rounded-full bg-slate-950/90 border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl flex items-center gap-1.5 select-none">
              {/* Tool Mode: Tilt & Pitch (Dual-Axis Incline Gizmo) */}
              <button
                type="button"
                onClick={() => setActive3DTool('hinge')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap flex-shrink-0 ${
                  active3DTool === 'hinge' || active3DTool === 'inspect'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Adjust roof pitch and roll tilt along building edges"
              >
                <RotateCw className="w-3.5 h-3.5 text-current flex-shrink-0" />
                <span>Tilt & Pitch</span>
              </button>

              {/* Tool Mode: Move Roof */}
              <button
                type="button"
                onClick={() => setActive3DTool('move')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap flex-shrink-0 ${
                  active3DTool === 'move'
                    ? 'bg-sky-400 text-slate-950 shadow-md shadow-sky-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Move roof in 3D: X East/West, Y Elevation, Z North/South"
              >
                <Move className="w-3.5 h-3.5 text-current flex-shrink-0" />
                <span>Move</span>
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM DOCK: Sun Simulation Slider */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-lg">
          <div className="p-3 rounded-2xl bg-slate-950/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl space-y-2 select-none">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <span className="text-amber-400">☀</span>
                Sun Simulation: {formatSunTime(sunHour)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSunHour(getDefaultSunHour())}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    Math.abs(sunHour - (new Date().getHours() + new Date().getMinutes() / 60)) < 0.2
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Snap sun to current local time"
                >
                  Now
                </button>
                {([6, 9, 12, 15, 18] as const).map((h) => {
                  const isCurrentTimeSelected =
                    Math.abs(sunHour - (new Date().getHours() + new Date().getMinutes() / 60)) < 0.2;
                  const isPresetActive = Math.abs(sunHour - h) < 0.5 && !isCurrentTimeSelected;
                  const label =
                    h === 6
                      ? '6 AM'
                      : h === 9
                      ? '9 AM'
                      : h === 12
                      ? '12 PM'
                      : h === 15
                      ? '3 PM'
                      : '6 PM';

                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setSunHour(h)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        isPresetActive
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              type="range"
              min="6.0"
              max="18.0"
              step="0.1"
              value={sunHour}
              onChange={(e) => setSunHour(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/15 rounded-full appearance-none cursor-pointer accent-amber-400"
            />

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-0.5">
              <span>6:00 AM (Sunrise East)</span>
              <span>12:00 PM (Solar Noon South)</span>
              <span>6:00 PM (Sunset West)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
