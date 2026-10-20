// src/features/solar-mapper/components/Roof3DPreviewCanvas.tsx
import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sun,
  Map,
  Compass,
  RotateCcw,
  Sliders,
  Layers,
} from 'lucide-react';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { projectVerticesToLocalMeters } from '../utils/geodesicMath';
import { RoofPolygonSection } from '../types/solarMapper';

// Single 3D Roof Mesh Component
const Roof3DMesh: React.FC<{ section: RoofPolygonSection; isActive: boolean }> = ({
  section,
  isActive,
}) => {
  const localPts = useMemo(() => {
    return projectVerticesToLocalMeters(section.vertices);
  }, [section.vertices]);

  // Construct 2D shape in local meters
  const shape = useMemo(() => {
    if (localPts.length < 3) return null;
    const s = new THREE.Shape();
    s.moveTo(localPts[0].x, localPts[0].y);
    for (let i = 1; i < localPts.length; i++) {
      s.lineTo(localPts[i].x, localPts[i].y);
    }
    s.closePath();
    return s;
  }, [localPts]);

  // Extrude settings: 120mm roof deck thickness
  const extrudeSettings = useMemo(
    () => ({
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    }),
    []
  );

  // Azimuth rotation: 0° is North (+Y), 180° is South (-Y)
  const azimuthRad = THREE.MathUtils.degToRad(-section.azimuthDeg + 180);
  const pitchRad = THREE.MathUtils.degToRad(section.pitchDeg);

  if (!shape) return null;

  return (
    <group rotation={[0, azimuthRad, 0]}>
      {/* Pitched Roof Plane */}
      <group rotation={[pitchRad, 0, 0]}>
        {/* Roof Deck Slab */}
        <mesh receiveShadow castShadow>
          <extrudeGeometry args={[shape, extrudeSettings]} />
          <meshStandardMaterial
            color={isActive ? '#334155' : '#1e293b'}
            roughness={0.7}
            metalness={0.15}
          />
        </mesh>

        {/* Photovoltaic Solar Panels Array */}
        {section.placedPanels.map((panel) => {
          const isLandscape = panel.orientation === 'landscape';
          const pW = panel.widthM;
          const pL = panel.lengthM;

          return (
            <group
              key={panel.id}
              position={[panel.x, panel.y, 0.14]}
            >
              {/* Dark Blue Anti-reflective Photovoltaic Glass */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[pW, pL, 0.035]} />
                <meshStandardMaterial
                  color="#0f2b48"
                  roughness={0.2}
                  metalness={0.8}
                  envMapIntensity={1.2}
                />
              </mesh>

              {/* Anodized Aluminum Outer Frame */}
              <mesh position={[0, 0, -0.005]}>
                <boxGeometry args={[pW + 0.015, pL + 0.015, 0.028]} />
                <meshStandardMaterial
                  color="#94a3b8"
                  roughness={0.3}
                  metalness={0.9}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
};

// 3D Scene Environment
const SceneContent: React.FC<{ sunHour: number }> = ({ sunHour }) => {
  const { roofSections, activeSectionId } = useSolarMapperStore();

  // Calculate sun trajectory: 6:00 AM (East) -> 12:00 PM (Noon South) -> 18:00 (West)
  const sunProgress = (sunHour - 6) / 12; // 0 to 1
  const sunElevationRad = Math.sin(sunProgress * Math.PI) * 1.1; // elevation above horizon
  const sunAzimuthRad = (sunProgress - 0.5) * Math.PI; // East (-PI/2) to West (+PI/2)

  const sunDistance = 28;
  const sunX = Math.sin(sunAzimuthRad) * sunDistance;
  const sunY = Math.max(1, Math.sin(sunElevationRad) * sunDistance);
  const sunZ = -Math.cos(sunAzimuthRad) * (sunDistance * 0.5);

  const activeSection =
    roofSections.find((s) => s.id === activeSectionId) || roofSections[0];

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[sunX, sunY, sunZ]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />

      {/* Ground Reference Plane with Grid */}
      <gridHelper args={[30, 30, '#475569', '#1e293b']} position={[0, -0.05, 0]} />

      {/* Cardinal Direction Markers */}
      <Text position={[0, 0.05, -14]} fontSize={1.2} color="#f59e0b" rotation={[-Math.PI / 2, 0, 0]}>
        N (0°)
      </Text>
      <Text position={[0, 0.05, 14]} fontSize={1.2} color="#f59e0b" rotation={[-Math.PI / 2, 0, 0]}>
        S (180°)
      </Text>
      <Text position={[14, 0.05, 0]} fontSize={1.2} color="#94a3b8" rotation={[-Math.PI / 2, 0, 0]}>
        E (90°)
      </Text>
      <Text position={[-14, 0.05, 0]} fontSize={1.2} color="#94a3b8" rotation={[-Math.PI / 2, 0, 0]}>
        W (270°)
      </Text>

      {/* Render Roof Sections */}
      {roofSections.map((sec) => (
        <Roof3DMesh
          key={sec.id}
          section={sec}
          isActive={sec.id === activeSection?.id}
        />
      ))}

      <OrbitControls
        makeDefault
        minDistance={4}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.05} // prevent going underneath ground
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
    loadDemoRoofPolygon,
  } = useSolarMapperStore();

  const activeSection =
    roofSections.find((s) => s.id === activeSectionId) || roofSections[0];

  const formatSunTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-[#090D16] shadow-xl">
      {/* 3D WebGL Canvas */}
      <div className="w-full h-[480px] sm:h-[560px] lg:h-[620px] relative">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
              Loading 3D Solar Model...
            </div>
          }
        >
          <Canvas
            shadows
            camera={{ position: [12, 14, 16], fov: 42 }}
            className="w-full h-full"
          >
            <SceneContent sunHour={sunHour} />
          </Canvas>
        </Suspense>

        {/* Top-Right: Return to 2D Satellite View Button */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('2d_satellite')}
            className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-bold backdrop-blur-md shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Map className="w-4 h-4 text-amber-500" />
            <span>2D Satellite Map</span>
          </button>
        </div>

        {/* Top-Left: Active Roof Metadata Badge */}
        <div className="absolute top-4 left-4 z-20 p-3 rounded-xl bg-slate-950/85 border border-slate-800 backdrop-blur-md shadow-md text-xs space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{activeSection?.name || 'Roof Section 1'}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span>Pitch: {activeSection?.pitchDeg ?? 15}°</span>
            <span>•</span>
            <span>Azimuth: {activeSection?.azimuthDeg ?? 180}° (S)</span>
            <span>•</span>
            <span>Panels: {activeSection?.recommendedMaxPanels ?? 0}</span>
          </div>
        </div>

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

        {/* Bottom Sun Position & Time Slider Control */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-20 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Sun Simulation:</span>
              <span className="font-mono text-amber-400">{formatSunTime(sunHour)}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {sunHour < 12 ? 'Morning Sunlight' : sunHour === 12 ? 'Solar Noon' : 'Afternoon Harvest'}
            </span>
          </div>

          <input
            type="range"
            min="6"
            max="18"
            step="0.25"
            value={sunHour}
            onChange={(e) => setSunHour(parseFloat(e.target.value))}
            className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>6:00 AM (Sunrise)</span>
            <span>12:00 PM (Noon)</span>
            <span>6:00 PM (Sunset)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
