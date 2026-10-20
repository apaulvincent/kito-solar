// src/features/solar-mapper/components/Roof3DPreviewCanvas.tsx
import React, { useMemo, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sun,
  Map,
  Compass,
  RotateCcw,
  Sliders,
  Layers,
  Eye,
  EyeOff,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import {
  calculateCentroid,
  projectSinglePointToMeters,
  projectVerticesToLocalMeters,
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

// Single 3D Roof & Building Component
const Roof3DMesh: React.FC<{
  section: RoofPolygonSection;
  siteCenter: GeoPoint;
  isActive: boolean;
  showWalls: boolean;
  onSelect: () => void;
}> = ({ section, siteCenter, isActive, showWalls, onSelect }) => {
  const secCentroid = useMemo(
    () => calculateCentroid(section.vertices),
    [section.vertices]
  );

  // Position relative to the shared site center
  const offsetMeters = useMemo(
    () => projectSinglePointToMeters(secCentroid, siteCenter),
    [secCentroid, siteCenter]
  );

  // 2D shape projected relative to ITS OWN centroid so rotation behaves predictably
  const localPts = useMemo(
    () => projectVerticesToLocalMeters(section.vertices, secCentroid),
    [section.vertices, secCentroid]
  );

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

  // Wall extrude settings (from ground to eave height)
  const wallExtrudeSettings = useMemo(
    () => ({
      depth: BUILDING_EAVE_HEIGHT,
      bevelEnabled: false,
    }),
    []
  );

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

  // In Three.js: World +X = East, World +Z = South, World -Z = North
  // Section offset:
  const worldX = offsetMeters.x;
  const worldZ = -offsetMeters.y;

  // Azimuth rotation: 180° is South (0 rad in our orientation)
  const azimuthRad = THREE.MathUtils.degToRad(-section.azimuthDeg + 180);
  const pitchRad = THREE.MathUtils.degToRad(section.pitchDeg);

  return (
    <group
      position={[worldX, 0, worldZ]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* 1. Optional Building Perimeter Walls */}
      {showWalls && (
        <group>
          <mesh
            position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            castShadow
          >
            <extrudeGeometry args={[shape, wallExtrudeSettings]} />
            <meshStandardMaterial
              color={isActive ? '#1e293b' : '#0f172a'}
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>

          {/* Foundation Plinth */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <extrudeGeometry args={[shape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.06 }]} />
            <meshStandardMaterial color="#0b1120" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* 2. Pitched Roof Assembly Sitting on Top of Eave Height */}
      <group position={[0, BUILDING_EAVE_HEIGHT, 0]}>
        {/* Compass Azimuth Rotation */}
        <group rotation={[0, azimuthRad, 0]}>
          {/* Pitch Rotation from Horizontal: Tilts down towards South */}
          <group rotation={[pitchRad, 0, 0]}>
            {/* Lay flat on horizontal plane (Extrusion depth extends upward along +Y) */}
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
              {section.placedPanels.map((panel) => {
                const pW = panel.widthM;
                const pL = panel.lengthM;

                return (
                  <group key={panel.id} position={[panel.x, panel.y, 0.17]}>
                    {/* Mounting Rails Underneath Panel */}
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

                    {/* Subtle Photovoltaic Busbar Grid Line Accent */}
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
  showWalls: boolean;
}> = ({ sunHour, showWalls }) => {
  const { roofSections, activeSectionId, setActiveSectionId, coordinates } =
    useSolarMapperStore();

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
        {/* Core Glowing Sun Orb */}
        <mesh>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        {/* Inner Solar Glow Aura */}
        <mesh>
          <sphereGeometry args={[1.8, 24, 24]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.4} />
        </mesh>
        {/* Outer Halo */}
        <mesh>
          <sphereGeometry args={[2.8, 24, 24]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.15} />
        </mesh>
        {/* Floating Time Label Next to the Sun in the Sky */}
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

      {/* Render ALL Roof Sections in their true spatial positions */}
      {roofSections.map((sec) => (
        <Roof3DMesh
          key={sec.id}
          section={sec}
          siteCenter={siteCenter}
          isActive={sec.id === activeSection?.id}
          showWalls={showWalls}
          onSelect={() => setActiveSectionId(sec.id)}
        />
      ))}

      <OrbitControls
        makeDefault
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
    loadDemoRoofPolygon,
  } = useSolarMapperStore();

  const [showWalls, setShowWalls] = useState(true);

  const activeSection =
    roofSections.find((s) => s.id === activeSectionId) || roofSections[0];

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
            camera={{ position: [16, 20, 26], fov: 46 }}
            className="w-full h-full"
          >
            <SceneContent sunHour={sunHour} showWalls={showWalls} />
          </Canvas>
        </Suspense>

        {/* Top-Right: View Actions & Wall Toggle */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {/* Building Walls Toggle */}
          <button
            type="button"
            onClick={() => setShowWalls(!showWalls)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-md shadow-md border transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap flex-shrink-0 ${
              showWalls
                ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
            }`}
            title="Toggle building walls visibility"
          >
            {showWalls ? <Eye className="w-3.5 h-3.5 flex-shrink-0" /> : <EyeOff className="w-3.5 h-3.5 flex-shrink-0" />}
            <span className="hidden sm:inline whitespace-nowrap">Walls {showWalls ? 'ON' : 'OFF'}</span>
          </button>

          {/* Switch back to 2D Map */}
          <button
            type="button"
            onClick={() => setViewMode('2d_satellite')}
            className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-bold backdrop-blur-md shadow-md transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap flex-shrink-0"
          >
            <Map className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="whitespace-nowrap">2D Satellite Map</span>
          </button>
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

        {/* Bottom Sun Position & Time Slider Island */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-20 p-3.5 rounded-2xl bg-slate-950/90 border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-white whitespace-nowrap flex-shrink-0">
              <Sun className="w-4 h-4 text-amber-500 flex-shrink-0" />
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
            className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
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
