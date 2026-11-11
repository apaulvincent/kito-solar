import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { RoofPolygonSection } from '../types/solarMapper';
import { rayFromClientCoords } from '../utils/sunMath';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { getOuterTiltSides, projectSinglePointToMeters } from '../utils/geodesicMath';
import {
  computeLocalPolygonBoundingRadius,
  degToRad,
  getPivotSideAngleRad,
  radToDeg,
} from '../utils/geometryAngles';

export const GizmoHudBadge: React.FC<{
  hudText: string | null;
  yOffset: number;
  fontSize: number;
}> = ({ hudText, yOffset, fontSize }) => {
  if (!hudText) return null;
  return (
    <group position={[0, yOffset, 0]} renderOrder={1000}>
      <mesh renderOrder={1000}>
        <planeGeometry args={[hudText.length * fontSize * 0.65 + fontSize * 2, fontSize * 2.2]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.88} depthTest={false} depthWrite={false} />
      </mesh>
      <Text fontSize={fontSize} color="#f8fafc" anchorX="center" anchorY="middle" renderOrder={1001}>
        {hudText}
      </Text>
    </group>
  );
};

interface TiltRingConfig {
  axis: 'x' | 'z';
  ringRotation: [number, number, number];
  reticlePos: [number, number, number];
  color: string;
  emissive: string;
  reticleEmissive: string;
}

export const RoofRotationGizmo3D: React.FC<{
  center: THREE.Vector3;
  section: RoofPolygonSection;
  onIsDraggingChange: (isDragging: boolean) => void;
}> = ({ center, section, onIsDraggingChange }) => {
  const { updateRoofSectionConfig } = useSolarMapperStore();
  const { camera, gl } = useThree();

  const [activeAxis, setActiveAxis] = useState<'x' | 'z' | null>(null);
  const [hudText, setHudText] = useState<string | null>(null);
  const cleanupDragRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupDragRef.current?.(), []);

  // Scale gimbal proportionally to roof span (~38%) so it stays legible on commercial roofs
  const radius = useMemo(() => {
    const maxDist = computeLocalPolygonBoundingRadius(section.vertices, projectSinglePointToMeters);
    return maxDist > 0 ? Math.max(3.2, Math.min(maxDist * 0.38, 45)) : 3.2;
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

  const sideAngleRad = useMemo(() => {
    if (section.vertices.length < 3) return 0;
    return getPivotSideAngleRad(getOuterTiltSides(section.vertices), section.pivotEdgeIndex);
  }, [section.vertices, section.pivotEdgeIndex]);

  const getPointerAngleOnRing = useCallback(
    (clientX: number, clientY: number, axis: 'x' | 'z'): number | null => {
      const ray = rayFromClientCoords(clientX, clientY, gl.domElement, camera);

      const cosY = Math.cos(sideAngleRad);
      const sinY = Math.sin(sideAngleRad);
      const normal =
        axis === 'x'
          ? new THREE.Vector3(cosY, 0, -sinY)
          : new THREE.Vector3(sinY, 0, cosY);

      // Fall back to camera-facing plane when viewing the ring edge-on
      const dot = Math.abs(ray.direction.dot(normal));
      const plane =
        dot < 0.08
          ? new THREE.Plane().setFromNormalAndCoplanarPoint(
              camera.getWorldDirection(new THREE.Vector3()).negate(),
              center
            )
          : new THREE.Plane().setFromNormalAndCoplanarPoint(normal, center);

      const hit = new THREE.Vector3();
      if (!ray.intersectPlane(plane, hit)) return null;

      const vWorldX = hit.x - center.x;
      const vWorldY = hit.y - center.y;
      const vWorldZ = hit.z - center.z;

      const vLocalX = vWorldX * cosY - vWorldZ * sinY;
      const vLocalZ = vWorldX * sinY + vWorldZ * cosY;

      return axis === 'x'
        ? radToDeg(Math.atan2(vWorldY, -vLocalZ))
        : radToDeg(Math.atan2(vWorldY, vLocalX));
    },
    [camera, center, gl, sideAngleRad]
  );

  const startRingDrag = (e: ThreeEvent<PointerEvent>, axis: 'x' | 'z') => {
    e.stopPropagation();
    cleanupDragRef.current?.();
    onIsDraggingChange(true);
    setActiveAxis(axis);

    const startDeg = axis === 'x' ? section.pitchDeg : (section.rollDeg ?? 0);
    const startAngle = getPointerAngleOnRing(e.clientX, e.clientY, axis) ?? startDeg;

    const onPointerMove = (evt: PointerEvent) => {
      const currentAngle = getPointerAngleOnRing(evt.clientX, evt.clientY, axis);
      if (currentAngle === null) return;

      let delta = currentAngle - startAngle;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;

      const nextDeg = Math.max(-60, Math.min(60, Math.round(startDeg + delta)));
      if (axis === 'x') {
        updateRoofSectionConfig(section.id, { pitchDeg: nextDeg });
        setHudText(`Pitch (Red): ${nextDeg}°`);
      } else {
        updateRoofSectionConfig(section.id, { rollDeg: nextDeg });
        setHudText(`Roll (Blue): ${nextDeg}°`);
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

  const xRad = degToRad(section.pitchDeg);
  const zRad = degToRad(section.rollDeg ?? 0);

  const rings: TiltRingConfig[] = [
    {
      axis: 'x',
      ringRotation: [0, Math.PI / 2, 0],
      reticlePos: [0, radius * Math.sin(xRad), -radius * Math.cos(xRad)],
      color: '#ef4444',
      emissive: '#b91c1c',
      reticleEmissive: '#dc2626',
    },
    {
      axis: 'z',
      ringRotation: [0, 0, 0],
      reticlePos: [radius * Math.cos(zRad), radius * Math.sin(zRad), 0],
      color: '#3b82f6',
      emissive: '#1d4ed8',
      reticleEmissive: '#2563eb',
    },
  ];

  return (
    <group position={[center.x, center.y, center.z]}>
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

      <group rotation={[0, sideAngleRad, 0]} renderOrder={995}>
        {rings.map((ring) => {
          const isRingActive = activeAxis === ring.axis;
          return (
            <group key={ring.axis} renderOrder={995}>
              <mesh
                rotation={ring.ringRotation}
                renderOrder={995}
                onPointerDown={(e) => startRingDrag(e, ring.axis)}
              >
                <torusGeometry
                  args={[radius, isRingActive ? activeTubeRadius : tubeRadius, 16, 64]}
                />
                <meshStandardMaterial
                  color={ring.color}
                  emissive={ring.emissive}
                  emissiveIntensity={isRingActive ? 1.4 : 0.65}
                  roughness={0.2}
                  depthTest={false}
                  depthWrite={false}
                />
              </mesh>
              <mesh
                rotation={ring.ringRotation}
                onPointerDown={(e) => startRingDrag(e, ring.axis)}
              >
                <torusGeometry args={[radius, hitBoxRadius, 8, 32]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
              <group
                position={ring.reticlePos}
                renderOrder={999}
                onPointerDown={(e) => startRingDrag(e, ring.axis)}
              >
                <mesh rotation={ring.ringRotation} renderOrder={999}>
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
                    color={ring.color}
                    emissive={ring.reticleEmissive}
                    emissiveIntensity={isRingActive ? 1.6 : 0.8}
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
          );
        })}
      </group>

      <GizmoHudBadge hudText={hudText} yOffset={hudYOffset} fontSize={hudFontSize} />
    </group>
  );
};
