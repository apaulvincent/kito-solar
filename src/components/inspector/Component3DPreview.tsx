// src/components/inspector/Component3DPreview.tsx
import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { NodeGeometry, getNodeTypeFromKey, NodeType } from '../diagram/NodeGeometry';
import { RotateCw, Box } from 'lucide-react';

interface Component3DPreviewProps {
  nodeKey: string;
  fallbackImagePath?: string;
  title?: string;
  className?: string;
}

function getOptimalCameraDistance(nodeType: NodeType): number {
  switch (nodeType) {
    case 'grid':
      return 4.6;
    case 'pv':
      return 4.4;
    case 'load':
      return 3.2;
    case 'inverter':
    case 'panel':
      return 2.8;
    case 'battery':
      return 2.6;
    case 'ats':
      return 2.3;
    case 'grounding':
      return 2.2;
    case 'breaker':
    case 'isolator':
    case 'spd':
    default:
      return 1.9;
  }
}

export function Component3DPreview({
  nodeKey,
  fallbackImagePath,
  title,
  className = '',
}: Component3DPreviewProps) {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [hasError, setHasError] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
      }
    } catch {
      setHasWebGL(false);
    }
  }, []);

  const nodeType = getNodeTypeFromKey(nodeKey);
  const cameraDistance = getOptimalCameraDistance(nodeType);

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  if (!hasWebGL || hasError) {
    const safeFallback = fallbackImagePath
      ? fallbackImagePath.endsWith('.webp')
        ? fallbackImagePath.replace('.webp', '.svg')
        : fallbackImagePath
      : '/assets/accessories/ac-breaker.svg';

    return (
      <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-slate-900 border border-slate-700/80 p-3 shadow-inner ${className}`}>
        <img
          src={safeFallback}
          alt={title || 'Component'}
          className="w-full h-full object-contain filter drop-shadow-md"
        />
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium text-slate-400 bg-slate-950/80 border border-slate-800">
          2D Asset
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/50 transition-colors shadow-inner select-none ${className}`}
      title="Click and drag to rotate 3D view"
    >
      {/* 3D Canvas Viewport */}
      <Canvas
        camera={{ position: [0, 0, cameraDistance], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        onError={() => setHasError(true)}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[4, 6, 5]} intensity={2.4} />
        <directionalLight position={[-4, -3, -2]} intensity={0.9} />
        <directionalLight position={[0, 4, -4]} intensity={1.0} />

        <Suspense fallback={null}>
          <Center>
            <NodeGeometry
              nodeType={nodeType}
              nodeKey={nodeKey}
              isStandalone={true}
              isHovered={true}
              isSelected={false}
            />
          </Center>
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enableZoom={true}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={1.8}
          minDistance={cameraDistance * 0.6}
          maxDistance={cameraDistance * 2.2}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={(5 * Math.PI) / 6}
        />
      </Canvas>

      {/* Floating 3D Badge */}
      <div className="pointer-events-none absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-sm text-[10px] font-mono text-amber-400 font-semibold shadow-sm">
        <Box className="w-3 h-3 text-amber-400" />
        <span>3D CAD Model</span>
      </div>

      {/* Reset Rotation Button */}
      <button
        type="button"
        onClick={handleResetView}
        className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs shadow-sm"
        title="Reset 3D camera angle"
      >
        <RotateCw className="w-3 h-3" />
      </button>

      {/* Subtle Drag Prompt at Bottom */}
      <div className="pointer-events-none absolute bottom-1.5 inset-x-0 flex justify-center">
        <span className="px-2 py-0.5 rounded text-[9px] font-mono text-slate-400 bg-slate-900/70 border border-slate-800/80 backdrop-blur-xs">
          Drag to orbit • Scroll to zoom
        </span>
      </div>
    </div>
  );
}
