import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { RoofPolygonSection } from '../types/solarMapper';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { projectSinglePointToMeters } from '../utils/geodesicMath';
import { computeLocalPolygonBoundingRadius } from '../utils/geometryAngles';
import { BUILDING_EAVE_HEIGHT, rayFromClientCoords } from '../utils/sunMath';
import { GizmoHudBadge } from './RoofRotationGizmo3D';

type DragAxis = 'x' | 'y' | 'z' | 'xz' | 'free';

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

const AXIS_VECTORS: Record<'x' | 'y' | 'z', THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

interface ArrowAxisConfig {
  axis: 'x' | 'y' | 'z';
  label: string;
  rotation: [number, number, number];
  direction: [number, number, number];
  color: string;
  shaftEmissive: string;
  coneEmissive: string;
  labelColor: string;
}

const CAD_ARROW_AXES: readonly ArrowAxisConfig[] = [
  {
    axis: 'x',
    label: 'X',
    rotation: [0, 0, -Math.PI / 2],
    direction: [1, 0, 0],
    color: '#ef4444',
    shaftEmissive: '#b91c1c',
    coneEmissive: '#dc2626',
    labelColor: '#fca5a5',
  },
  {
    axis: 'y',
    label: 'Y',
    rotation: [0, 0, 0],
    direction: [0, 1, 0],
    color: '#22c55e',
    shaftEmissive: '#15803d',
    coneEmissive: '#16a34a',
    labelColor: '#86efac',
  },
  {
    axis: 'z',
    label: 'Z',
    rotation: [Math.PI / 2, 0, 0],
    direction: [0, 0, 1],
    color: '#3b82f6',
    shaftEmissive: '#1d4ed8',
    coneEmissive: '#2563eb',
    labelColor: '#93c5fd',
  },
];

export const RoofMoveGizmo3D: React.FC<{
  center: THREE.Vector3;
  section: RoofPolygonSection;
  onIsDraggingChange: (isDragging: boolean) => void;
}> = ({ center, section, onIsDraggingChange }) => {
  const { translateRoofSection, updateRoofSectionConfig } = useSolarMapperStore();
  const { camera, gl } = useThree();

  const [activeAxis, setActiveAxis] = useState<DragAxis | null>(null);
  const [hudText, setHudText] = useState<string | null>(null);
  const cleanupDragRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupDragRef.current?.(), []);

  const scaleFactor = useMemo(() => {
    const maxDist = computeLocalPolygonBoundingRadius(section.vertices, projectSinglePointToMeters);
    return maxDist > 0 ? Math.max(1, Math.min(maxDist / 7.5, 12)) : 1;
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

  const handlePointerDown = (e: ThreeEvent<PointerEvent>, axis: DragAxis) => {
    e.stopPropagation();
    cleanupDragRef.current?.();
    onIsDraggingChange(true);
    setActiveAxis(axis);

    const frozenCenter = center.clone();
    const axisUnit = axis === 'x' || axis === 'y' || axis === 'z' ? AXIS_VECTORS[axis] : null;
    const plane = axisUnit
      ? getAxisPlane(axisUnit, frozenCenter, camera)
      : new THREE.Plane(new THREE.Vector3(0, 1, 0), -frozenCenter.y);

    const getHitPoint = (clientX: number, clientY: number): THREE.Vector3 | null => {
      const ray = rayFromClientCoords(clientX, clientY, gl.domElement, camera);
      const target = new THREE.Vector3();
      return ray.intersectPlane(plane, target);
    };

    let lastHit = getHitPoint(e.clientX, e.clientY);
    let lastProj =
      axisUnit && lastHit ? new THREE.Vector3().subVectors(lastHit, frozenCenter).dot(axisUnit) : 0;
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
            translateRoofSection(section.id, delta, 0);
            accumX += delta;
            setHudText(`X (East/West): ${accumX >= 0 ? '+' : ''}${accumX.toFixed(2)}m`);
          } else if (axis === 'z') {
            // +Z in Three.js points South, so northward map translation is -delta
            translateRoofSection(section.id, 0, -delta);
            accumZ += delta;
            setHudText(`Z (North/South): ${-accumZ >= 0 ? '+' : ''}${-accumZ.toFixed(2)}m`);
          } else if (axis === 'y') {
            accumY += delta;
            const newHeight = Math.max(
              0.5,
              Math.min(35.0, Math.round((initialHeight + accumY) * 10) / 10)
            );
            updateRoofSectionConfig(section.id, { baseHeightMeters: newHeight });
            setHudText(
              `Elevation (Y): ${newHeight.toFixed(1)}m (${accumY >= 0 ? '+' : ''}${accumY.toFixed(1)}m)`
            );
          }
          lastProj = currentProj;
        }
      } else {
        if (!lastHit) return;
        const dx = currentHit.x - lastHit.x;
        const dz = currentHit.z - lastHit.z;

        if (Math.hypot(dx, dz) >= 0.03) {
          const deltaGeoY = -dz;
          translateRoofSection(section.id, dx, deltaGeoY);
          accumX += dx;
          accumZ += deltaGeoY;
          setHudText(
            `Δ East: ${accumX >= 0 ? '+' : ''}${accumX.toFixed(1)}m, North: ${accumZ >= 0 ? '+' : ''}${accumZ.toFixed(1)}m`
          );
          lastHit = currentHit;
        }
      }
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', cleanup);
      cleanupDragRef.current = null;
      onIsDraggingChange(false);
      setActiveAxis(null);
      setHudText(null);
    };

    cleanupDragRef.current = cleanup;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', cleanup);
  };

  return (
    <group position={[center.x, center.y, center.z]} renderOrder={995}>
      {CAD_ARROW_AXES.map((cfg) => {
        const isAxisActive = activeAxis === cfg.axis;
        return (
          <group key={cfg.axis} renderOrder={995}>
            <group rotation={cfg.rotation}>
              <mesh
                position={[0, shaftLength / 2, 0]}
                renderOrder={995}
                onPointerDown={(e) => handlePointerDown(e, cfg.axis)}
              >
                <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 16]} />
                <meshStandardMaterial
                  color={cfg.color}
                  emissive={cfg.shaftEmissive}
                  emissiveIntensity={isAxisActive ? 1.6 : 0.7}
                  roughness={0.25}
                  metalness={0.4}
                  depthTest={false}
                  depthWrite={false}
                />
              </mesh>
              <mesh
                position={[0, shaftLength + coneHeight / 2, 0]}
                renderOrder={995}
                onPointerDown={(e) => handlePointerDown(e, cfg.axis)}
              >
                <coneGeometry args={[coneRadius, coneHeight, 24]} />
                <meshStandardMaterial
                  color={cfg.color}
                  emissive={cfg.coneEmissive}
                  emissiveIntensity={isAxisActive ? 1.8 : 0.8}
                  roughness={0.2}
                  metalness={0.4}
                  depthTest={false}
                  depthWrite={false}
                />
              </mesh>
              <mesh
                position={[0, shaftLength / 2 + 0.2 * scaleFactor, 0]}
                onPointerDown={(e) => handlePointerDown(e, cfg.axis)}
              >
                <cylinderGeometry
                  args={[hitRadius, hitRadius, shaftLength + coneHeight + 0.4 * scaleFactor, 8]}
                />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
            </group>

            <Text
              position={[
                cfg.direction[0] * labelOffset,
                cfg.direction[1] * labelOffset,
                cfg.direction[2] * labelOffset,
              ]}
              fontSize={labelFontSize}
              color={cfg.labelColor}
              anchorX="center"
              anchorY="middle"
              renderOrder={999}
            >
              {cfg.label}
            </Text>
          </group>
        );
      })}

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

      <GizmoHudBadge hudText={hudText} yOffset={hudYOffset} fontSize={hudFontSize} />
    </group>
  );
};
