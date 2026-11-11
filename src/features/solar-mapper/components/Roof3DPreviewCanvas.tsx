import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { calculateCentroid, projectSinglePointToMeters } from '../utils/geodesicMath';
import { GeoPoint } from '../types/solarMapper';
import { getDefaultSunHour } from '../utils/solarPhysics';
import {
  BUILDING_EAVE_HEIGHT,
  getRoofAnchorWorldPos,
  getSunPosition,
} from '../utils/sunMath';
import { Roof3DMesh } from './Roof3DMesh';
import { RoofRotationGizmo3D } from './RoofRotationGizmo3D';
import { RoofMoveGizmo3D } from './RoofMoveGizmo3D';
import { CelestialSunArc, SunOrbAndLight, SunlightRay } from './CelestialSunRig';
import { Roof3DHudControls } from './Roof3DHudControls';

export { getRoofAnchorWorldPos };

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

const SceneContent: React.FC<{
  sunHour: number;
  activeTool: 'inspect' | 'move' | 'hinge';
}> = ({ sunHour, activeTool }) => {
  const { roofSections, activeSectionId, setActiveSectionId, coordinates } =
    useSolarMapperStore();
  const [isInteractingWithGizmo, setIsInteractingWithGizmo] = useState(false);

  const validSections = useMemo(
    () => roofSections.filter((s) => s.vertices.length >= 3),
    [roofSections]
  );

  // Re-center 3D stage origin when section count changes or the traced roof shifts >40m
  const stableOriginRef = useRef<GeoPoint | null>(null);
  const prevSectionsCountRef = useRef<number>(-1);

  const siteCenter = useMemo(() => {
    if (validSections.length > 0) {
      const centroid = calculateCentroid(validSections.flatMap((s) => s.vertices));
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

    return {
      stageGridSize: Math.max(50, Math.ceil((maxDist * 2.6) / 10) * 10),
      celestialOrbitRadius: Math.max(32, Math.ceil(maxDist * 1.85)),
      maxDistMeters: maxDist,
    };
  }, [validSections, siteCenter]);

  const gridDivisions = useMemo(
    () => Math.min(100, Math.max(40, Math.round(stageGridSize / 1.5))),
    [stageGridSize]
  );

  const cardinalOffset = stageGridSize * 0.44;
  const cardinalFontSize = Math.max(1.1, stageGridSize * 0.03);

  const sunPos = useMemo(
    () => getSunPosition(sunHour, celestialOrbitRadius),
    [sunHour, celestialOrbitRadius]
  );

  const activeSection = activeSectionId
    ? roofSections.find((s) => s.id === activeSectionId) || null
    : null;

  const activeRoofWorldCenter = useMemo(() => {
    if (!activeSection || activeSection.vertices.length < 3) {
      return new THREE.Vector3(0, BUILDING_EAVE_HEIGHT + 0.5, 0);
    }
    return getRoofAnchorWorldPos(activeSection, siteCenter);
  }, [activeSection, siteCenter]);

  const groundDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const cardinalMarkers: { pos: [number, number, number]; color: string; label: string }[] = [
    { pos: [0, 0.05, -cardinalOffset], color: '#f59e0b', label: 'N (0°)' },
    { pos: [0, 0.05, cardinalOffset], color: '#f59e0b', label: 'S (180°)' },
    { pos: [cardinalOffset, 0.05, 0], color: '#94a3b8', label: 'E (90°)' },
    { pos: [-cardinalOffset, 0.05, 0], color: '#94a3b8', label: 'W (270°)' },
  ];

  return (
    <>
      <CameraFramer maxDistMeters={maxDistMeters} />
      <SunOrbAndLight sunPos={sunPos} sunHour={sunHour} orbitRadius={celestialOrbitRadius} />
      <CelestialSunArc radius={celestialOrbitRadius} />

      {activeSection && <SunlightRay sunPos={sunPos} targetPos={activeRoofWorldCenter} />}

      <gridHelper
        args={[stageGridSize, gridDivisions, '#475569', '#1e293b']}
        position={[0, -0.02, 0]}
      />

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

      {cardinalMarkers.map((marker) => (
        <Text
          key={marker.label}
          position={marker.pos}
          fontSize={cardinalFontSize}
          color={marker.color}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {marker.label}
        </Text>
      ))}

      {roofSections.map((sec) => (
        <Roof3DMesh
          key={sec.id}
          section={sec}
          siteCenter={siteCenter}
          isActive={sec.id === activeSection?.id}
          onSelect={() => setActiveSectionId(sec.id)}
        />
      ))}

      {activeSection && activeSection.vertices.length >= 3 && (
        activeTool === 'move' ? (
          <RoofMoveGizmo3D
            center={activeRoofWorldCenter}
            section={activeSection}
            onIsDraggingChange={setIsInteractingWithGizmo}
          />
        ) : (
          <RoofRotationGizmo3D
            center={activeRoofWorldCenter}
            section={activeSection}
            onIsDraggingChange={setIsInteractingWithGizmo}
          />
        )
      )}

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
  } = useSolarMapperStore();

  const canvasPointerDownRef = useRef<{ x: number; y: number } | null>(null);

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
      if (dist > 6) return;
    }
    setActiveSectionId(null);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-[#070b14] shadow-2xl">
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
            <SceneContent sunHour={sunHour} activeTool={active3DTool} />
          </Canvas>
        </Suspense>

        <Roof3DHudControls
          roofSections={roofSections}
          activeSection={activeSection}
          active3DTool={active3DTool}
          sunHour={sunHour}
          onSetViewMode={setViewMode}
          onSetActiveTool={setActive3DTool}
          onSetSunHour={setSunHour}
        />
      </div>
    </div>
  );
};
