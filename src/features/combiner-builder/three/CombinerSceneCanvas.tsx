// src/features/combiner-builder/three/CombinerSceneCanvas.tsx
import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
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
    camera.position.set(0, 0, 4.3);
    camera.lookAt(0, 0, 0);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [resetViewCount, camera, controls]);

  return null;
}

export function CombinerSceneCanvas({ resetViewCount }: CombinerSceneCanvasProps) {
  const components = useCombinerBoxStore((s) => s.components);
  const wires = useCombinerBoxStore((s) => s.wires);
  const setSelectedComponent = useCombinerBoxStore((s) => s.setSelectedComponent);
  const setSelectedWire = useCombinerBoxStore((s) => s.setSelectedWire);
  const setSelectedPort = useCombinerBoxStore((s) => s.setSelectedPort);

  const handleBackgroundClick = () => {
    setSelectedComponent(null);
    setSelectedWire(null);
    setSelectedPort(null);
  };

  return (
    <div className="w-full h-full relative select-none bg-[#090d16]">
      <Canvas
        camera={{ position: [0, 0, 4.3], fov: 40 }}
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={handleBackgroundClick}
      >
        <color attach="background" args={['#090d16']} />

        {/* High-Contrast Studio Lighting Rig */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[4, 6, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-4, 4, 3]} intensity={0.7} color="#38bdf8" />
        <pointLight position={[0, -2, 3]} intensity={0.6} color="#f59e0b" />

        <CameraResetController resetViewCount={resetViewCount} />

        <Suspense fallback={null}>
          <group position={[0, 0, 0]}>
            {/* 3D Enclosure, Backplate, Rails, Knockouts */}
            <EnclosureAndDinRailsMesh />

            {/* Placed Circuit Breakers, SPDs, ATS, Meters */}
            {components.map((comp) => (
              <DinComponentMesh key={comp.id} component={comp} />
            ))}

            {/* 3D Insulated Wires with Ferrules & Animated Current */}
            {wires.map((wire) => (
              <InsulatedWireTubeMesh key={wire.id} wire={wire} />
            ))}
          </group>
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={1.5}
          maxDistance={7.0}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={0.05}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
