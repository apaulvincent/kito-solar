// src/features/combiner-builder/three/CombinerSceneCanvas.tsx
import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';
import { EnclosureAndDinRailsMesh } from './EnclosureAndDinRailsMesh';
import { DinComponentMesh } from './DinComponentMesh';
import { InsulatedWireTubeMesh } from './InsulatedWireTubeMesh';

interface CombinerSceneCanvasProps {
  resetViewCount?: number;
}

function CameraResetController({ resetViewCount }: { resetViewCount?: number }) {
  const { camera } = useThree();
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;

  useEffect(() => {
    if (resetViewCount === undefined || resetViewCount === 0) return;
    camera.position.set(0, 0, 5.75);
    camera.lookAt(0, 0, 0);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [resetViewCount, camera, controls]);

  return null;
}

export function CombinerSceneCanvas({ resetViewCount }: CombinerSceneCanvasProps) {
  const theme = useCalculatorStore((s) => s.theme);
  const isDark = theme === 'dark';

  const components = useCombinerBoxStore((s) => s.components);
  const wires = useCombinerBoxStore((s) => s.wires);
  const setSelectedComponent = useCombinerBoxStore((s) => s.setSelectedComponent);
  const setSelectedWire = useCombinerBoxStore((s) => s.setSelectedWire);
  const setSelectedPort = useCombinerBoxStore((s) => s.setSelectedPort);

  const hasBatteryMccb = components.some((c) => c.category === 'battery_mccb');

  const handleBackgroundClick = () => {
    setSelectedComponent(null);
    setSelectedWire(null);
    setSelectedPort(null);
  };

  const canvasBg = isDark ? '#0b0f19' : '#f1f5f9';

  return (
    <div className={`w-full h-full relative select-none ${isDark ? 'bg-[#0b0f19]' : 'bg-[#f1f5f9]'}`}>
      <Canvas
        camera={{ position: [0, 0, 5.75], fov: 40 }}
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={handleBackgroundClick}
      >
        <color attach="background" args={[canvasBg]} />

        {/* Studio Lighting Rig calibrated for Light and Dark modes */}
        <ambientLight intensity={isDark ? 1.15 : 1.35} />
        <directionalLight position={[5, 8, 6]} intensity={isDark ? 1.5 : 1.3} castShadow />
        <directionalLight
          position={[-5, 4, 4]}
          intensity={isDark ? 0.75 : 0.65}
          color={isDark ? '#93c5fd' : '#bae6fd'}
        />
        <pointLight
          position={[0, -1.8, 2.5]}
          intensity={isDark ? 0.85 : 0.5}
          color={isDark ? '#fef08a' : '#ffffff'}
        />

        <CameraResetController resetViewCount={resetViewCount} />

        <Suspense fallback={null}>
          <group position={[0, 0.16, 0]}>
            {/* 3D Enclosure, Backplate, Rails, Knockouts & Live Feeders */}
            <EnclosureAndDinRailsMesh hasBatteryMccb={hasBatteryMccb} />

            {/* Placed Circuit Breakers, SPDs, ATS, Isolators, Protectors & Meters */}
            {components.map((comp) => (
              <DinComponentMesh key={comp.id} component={comp} />
            ))}

            {/* 3D Insulated Wires with Ferrules & Live Energy */}
            {wires.map((wire) => (
              <InsulatedWireTubeMesh key={wire.id} wire={wire} />
            ))}
          </group>
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={1.8}
          maxDistance={7.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={0.05}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
