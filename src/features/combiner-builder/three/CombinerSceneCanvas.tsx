// src/features/combiner-builder/three/CombinerSceneCanvas.tsx
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';
import { EnclosureAndDinRailsMesh } from './EnclosureAndDinRailsMesh';
import { DinComponentMesh } from './DinComponentMesh';
import { InsulatedWireTubeMesh } from './InsulatedWireTubeMesh';

export function CombinerSceneCanvas() {
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
        camera={{ position: [0, 0, 3.2], fov: 46 }}
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={handleBackgroundClick}
      >
        <color attach="background" args={['#090d16']} />

        {/* Studio Lighting Rig */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 4]} intensity={1.4} castShadow />
        <directionalLight position={[-4, 3, 2]} intensity={0.6} color="#38bdf8" />
        <pointLight position={[0, -2, 2]} intensity={0.5} color="#f59e0b" />

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
          minDistance={1.2}
          maxDistance={5.5}
          maxPolarAngle={Math.PI / 1.7}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
