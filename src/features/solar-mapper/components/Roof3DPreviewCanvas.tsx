// src/features/solar-mapper/components/Roof3DPreviewCanvas.tsx
import React, { useMemo, useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame, ThreeEvent } from '@react-three/fiber';
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
import { GeoPoint, RoofPolygonSection } from '../types/solarMapper';
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

/**
 * Single 3D Roof Mesh Component.
 * Rotates directly on its center of mass across XYZ axes.
 */
const Roof3DMesh: React.FC<{
  section: RoofPolygonSection;
  siteCenter: GeoPoint;
  isActive: boolean;
  onSelect: () => void;
  onCentroidWorldUpdate: (pos: THREE.Vector3) => void;
}> = ({
  section,
  siteCenter,
  isActive,
  onSelect,
  onCentroidWorldUpdate,
}) => {
  const centroidAnchorRef = useRef<THREE.Group>(null);

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

  // Feed real-time 3D world centroid position to scene gizmos (elevated on top of roof surface)
  useFrame(() => {
    if (isActive && centroidAnchorRef.current) {
      const worldPos = new THREE.Vector3();
      centroidAnchorRef.current.getWorldPosition(worldPos);
      onCentroidWorldUpdate(worldPos);
    }
  });

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

                {/* Photovoltaic Solar Panels Array */}
                {section.placedPanels?.map((panel) => {
                  const pW = panel.widthM;
                  const pL = panel.lengthM;

                  return (
                    <group
                      key={panel.id}
                      position={[panel.x, panel.y, 0.12]}
                      rotation={[0, 0, (panel.rotationDeg || 0) * (Math.PI / 180)]}
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

              {/* Centroid Anchor for gizmos: positioned comfortably on top of the roof surface */}
              <group ref={centroidAnchorRef} position={[0, 0, 0.45]} />
            </group>
          </group>
        </group>
      </group>
    </group>
  </group>
);
};

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

  const radius = 3.2; // 3.2m diameter ring

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
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" depthTest={false} depthWrite={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={999}>
          <ringGeometry args={[0.25, 0.3, 32]} />
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
            <torusGeometry args={[radius, activeAxis === 'x' ? 0.08 : 0.05, 16, 64]} />
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
            <torusGeometry args={[radius, 0.35, 8, 32]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          {/* Grab Reticle Dot on Red Ring */}
          <group position={xReticlePos} renderOrder={999} onPointerDown={handleXPointerDown}>
            <mesh rotation={[0, Math.PI / 2, 0]} renderOrder={999}>
              <ringGeometry args={[0.16, 0.26, 24]} />
              <meshBasicMaterial
                color="#ffffff"
                side={THREE.DoubleSide}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
            <mesh renderOrder={999}>
              <sphereGeometry args={[0.14, 16, 16]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#dc2626"
                emissiveIntensity={activeAxis === 'x' ? 1.6 : 0.8}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.4, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          </group>
        </group>

        {/* BLUE RING (Z-AXIS / ROLL TILT ALONG WIDTH - Always on top) */}
        <group renderOrder={995}>
          <mesh rotation={[0, 0, 0]} renderOrder={995} onPointerDown={handleZPointerDown}>
            <torusGeometry args={[radius, activeAxis === 'z' ? 0.08 : 0.05, 16, 64]} />
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
            <torusGeometry args={[radius, 0.35, 8, 32]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          {/* Grab Reticle Dot on Blue Ring */}
          <group position={zReticlePos} renderOrder={999} onPointerDown={handleZPointerDown}>
            <mesh rotation={[0, 0, 0]} renderOrder={999}>
              <ringGeometry args={[0.16, 0.26, 24]} />
              <meshBasicMaterial
                color="#ffffff"
                side={THREE.DoubleSide}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
            <mesh renderOrder={999}>
              <sphereGeometry args={[0.14, 16, 16]} />
              <meshStandardMaterial
                color="#3b82f6"
                emissive="#2563eb"
                emissiveIntensity={activeAxis === 'z' ? 1.6 : 0.8}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.4, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Live Floating HUD Badge while dragging */}
      {hudText && (
        <group position={[0, radius + 0.6, 0]} renderOrder={1000}>
          <Text>
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

  const shaftLength = 2.4;
  const shaftRadius = 0.045;
  const coneHeight = 0.55;
  const coneRadius = 0.16;

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
          position={[shaftLength / 2 + 0.2, 0, 0]}
          rotation={[0, 0, -Math.PI / 2]}
          onPointerDown={(e) => handlePointerDown(e, 'x')}
        >
          <cylinderGeometry args={[0.35, 0.35, shaftLength + coneHeight + 0.4, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Axis Label */}
        <Text
          position={[shaftLength + coneHeight + 0.45, 0, 0]}
          fontSize={0.36}
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
          position={[0, shaftLength / 2 + 0.2, 0]}
          onPointerDown={(e) => handlePointerDown(e, 'y')}
        >
          <cylinderGeometry args={[0.35, 0.35, shaftLength + coneHeight + 0.4, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Axis Label */}
        <Text
          position={[0, shaftLength + coneHeight + 0.45, 0]}
          fontSize={0.36}
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
          position={[0, 0, shaftLength / 2 + 0.2]}
          rotation={[Math.PI / 2, 0, 0]}
          onPointerDown={(e) => handlePointerDown(e, 'z')}
        >
          <cylinderGeometry args={[0.35, 0.35, shaftLength + coneHeight + 0.4, 8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {/* Axis Label */}
        <Text
          position={[0, 0, shaftLength + coneHeight + 0.45]}
          fontSize={0.36}
          color="#93c5fd"
          anchorX="center"
          anchorY="middle"
          renderOrder={999}
        >
          Z
        </Text>
      </group>

      {/* 4. XZ GROUND PLANE CORNER HANDLE (Free horizontal translation between X & Z) */}
      <group position={[0.7, 0, 0.7]} renderOrder={996}>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={996}
          onPointerDown={(e) => handlePointerDown(e, 'xz')}
        >
          <planeGeometry args={[0.75, 0.75]} />
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
            [-0.375, 0, 0.375],
            [0.375, 0, 0.375],
            [0.375, 0, -0.375],
          ]}
          color="#38bdf8"
          lineWidth={2}
          depthTest={false}
        />
      </group>

      {/* 5. CENTER ORIGIN SPHERE (Free 2D Translation) */}
      <group renderOrder={998} onPointerDown={(e) => handlePointerDown(e, 'free')}>
        <mesh renderOrder={998}>
          <sphereGeometry args={[0.15, 20, 20]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#38bdf8"
            emissiveIntensity={activeAxis === 'free' ? 1.8 : 0.9}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={998}>
          <ringGeometry args={[0.2, 0.28, 24]} />
          <meshBasicMaterial
            color="#38bdf8"
            side={THREE.DoubleSide}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.45, 12, 12]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>

      {/* 6. LIVE DELTA READOUT HUD BADGE (Elevated in scene) */}
      {hudText && (
        <group position={[0, shaftLength + coneHeight + 1.2, 0]} renderOrder={1000}>
          <mesh renderOrder={1000}>
            <planeGeometry args={[hudText.length * 0.16 + 0.6, 0.55]} />
            <meshBasicMaterial
              color="#020617"
              transparent
              opacity={0.88}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
          <Text
            fontSize={0.24}
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
const CelestialSunArc: React.FC = () => {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    // Smoothly sample the celestial diurnal circle from 6:00 AM to 6:00 PM
    for (let h = 6.0; h <= 18.0; h += 0.1) {
      const p = getSunPosition(h, CELESTIAL_ORBIT_RADIUS);
      pts.push([p.x, p.y, p.z]);
    }
    return pts;
  }, []);

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
        const pos = getSunPosition(h, CELESTIAL_ORBIT_RADIUS);
        return (
          <group key={h} position={[pos.x, pos.y, pos.z]}>
            <mesh>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.7} />
            </mesh>
            <Text
              position={[0, 0.65, 0]}
              fontSize={0.55}
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
  const [activeRoofWorldCenter, setActiveRoofWorldCenter] = useState<THREE.Vector3>(
    () => new THREE.Vector3(0, BUILDING_EAVE_HEIGHT + 0.5, 0)
  );

  const handleGizmoDragState = useCallback(
    (isDragging: boolean) => {
      setIsInteractingWithGizmo(isDragging);
      onIsDraggingChange(isDragging);
    },
    [onIsDraggingChange]
  );

  const sunPos = useMemo(() => getSunPosition(sunHour, CELESTIAL_ORBIT_RADIUS), [sunHour]);

  // Stable 3D Coordinate Origin:
  // Initialized to project coordinates or initial roof polygon centroid when loaded/added/removed.
  // We NEVER recalculate this during roof translation or rotation, ensuring each roof moves 100% independently!
  const stableOriginRef = useRef<GeoPoint | null>(null);
  const sectionIdsKey = useMemo(() => roofSections.map((s) => s.id).join(','), [roofSections]);
  const coordsKey = `${coordinates.lat.toFixed(6)},${coordinates.lng.toFixed(6)}`;
  const prevKeyRef = useRef<string>('');

  const siteCenter = useMemo(() => {
    const currentKey = `${sectionIdsKey}__${coordsKey}`;
    if (!stableOriginRef.current || prevKeyRef.current !== currentKey) {
      prevKeyRef.current = currentKey;
      if (roofSections.length > 0 && roofSections.some((s) => s.vertices.length > 0)) {
        const allVertices = roofSections.flatMap((s) => s.vertices);
        stableOriginRef.current = calculateCentroid(allVertices);
      } else {
        stableOriginRef.current = coordinates;
      }
    }
    return stableOriginRef.current;
  }, [sectionIdsKey, coordsKey, coordinates, roofSections]);

  const sunLightColor = useMemo(() => {
    if (sunHour < 7.5 || sunHour > 16.5) return '#fed7aa';
    if (sunHour < 9.5 || sunHour > 14.5) return '#fef08a';
    return '#ffffff';
  }, [sunHour]);

  const activeSection = activeSectionId
    ? roofSections.find((s) => s.id === activeSectionId) || null
    : null;

  const groundDownPosRef = useRef<{ x: number; y: number } | null>(null);

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

      {/* Sunlight Ray (Active Roof) */}
      {activeSection && (
        <SunlightRay sunPos={sunPos} targetPos={activeRoofWorldCenter} />
      )}

      {/* Ground Reference Plane with Grid */}
      <gridHelper args={[40, 40, '#475569', '#1e293b']} position={[0, -0.02, 0]} />

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
        <planeGeometry args={[180, 180]} />
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
          onCentroidWorldUpdate={setActiveRoofWorldCenter}
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

        {/* TOP-CENTER FLOATING STUDIO CONTROLS DOCK (High-End Double-Bezel Design) */}
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
