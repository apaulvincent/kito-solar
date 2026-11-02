// src/components/diagram/PlacedComponentMesh.tsx
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { ADDABLE_CATALOG_MAP } from '@/lib/layout3dEngine';
import { PlacedComponent3D } from '@/types/layout3d';
import { NodeGeometry } from './NodeGeometry';
import { useSurfaceNodeDrag } from './useSurfaceNodeDrag';

interface PlacedComponentMeshProps {
  item: PlacedComponent3D;
  onLockControls: (locked: boolean) => void;
  onWireStart?: (nodeId: string, clientX: number, clientY: number) => boolean;
}

export function PlacedComponentMesh({
  item,
  onLockControls,
  onWireStart,
}: PlacedComponentMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const selectedCustomNodeId = useCalculatorStore((s) => s.selectedCustomNodeId);
  const setSelectedCustomNodeId = useCalculatorStore((s) => s.setSelectedCustomNodeId);
  const movePlacedComponent = useCalculatorStore((s) => s.movePlacedComponent);
  const canvasTool = useCalculatorStore((s) => s.canvasTool);

  const spec = ADDABLE_CATALOG_MAP.get(item.catalogKey);
  if (!spec) return null;

  const isSelected = selectedCustomNodeId === item.id;
  const [width, height] = spec.dimensions;
  const haloWidth = width + 0.32;
  const haloHeight = height + 0.32;

  const { handlePointerDown, isDraggingRef } = useSurfaceNodeDrag({
    nodeId: item.id,
    meshRef,
    position: item.position,
    surface: item.surface,
    capability: spec.mountCapability,
    componentHeight: height,
    floorCenterY: spec.floorCenterY,
    canvasTool,
    onLockControls,
    onWireStart,
    onClickSelect: () => setSelectedCustomNodeId(item.id),
    onCommitMove: (nextPos, nextSurface) => movePlacedComponent(item.id, nextPos, nextSurface),
  });

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetScale = isSelected ? 1.09 : hovered ? 1.04 : 1.0;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 14
    );
  });

  return (
    <group
      ref={meshRef}
      position={item.position}
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (!isDraggingRef.current) {
          document.body.style.cursor = canvasTool === 'select' ? 'grab' : 'crosshair';
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        if (!isDraggingRef.current) {
          document.body.style.cursor = 'auto';
        }
      }}
    >
      <NodeGeometry
        nodeType={spec.nodeType}
        nodeKey={item.catalogKey}
        isSelected={isSelected}
        isHovered={hovered}
        color={spec.color}
      />

      {(isSelected || hovered) && (
        <>
          {item.surface === 'wall' ? (
            <group position={[0, 0, -0.07]}>
              <mesh>
                <planeGeometry args={[haloWidth, haloHeight]} />
                <meshBasicMaterial
                  color={isSelected ? '#F59E0B' : '#38BDF8'}
                  transparent
                  opacity={isSelected ? 0.42 : 0.22}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <lineSegments>
                <edgesGeometry args={[new THREE.PlaneGeometry(haloWidth, haloHeight)]} />
                <lineBasicMaterial
                  color={isSelected ? '#F59E0B' : '#38BDF8'}
                  transparent
                  opacity={isSelected ? 0.9 : 0.6}
                />
              </lineSegments>
            </group>
          ) : (
            <mesh
              position={[0, -spec.floorCenterY + 0.02, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[Math.max(0.55, width * 0.48), Math.max(0.75, width * 0.62), 32]} />
              <meshBasicMaterial
                color={isSelected ? '#F59E0B' : spec.color}
                transparent
                opacity={0.65}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </>
      )}

      {(hovered || isSelected) && (
        <Html
          position={[0, height / 2 + 0.42, 0]}
          center
          distanceFactor={16}
          zIndexRange={[16, 0]}
          className="pointer-events-none select-none"
        >
          <div className="px-2.5 py-1 rounded-lg border border-slate-700/90 bg-slate-900/95 text-white shadow-xl whitespace-nowrap font-mono text-[10px]">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: spec.color }}
              />
              <span className="font-bold">{item.label}</span>
              <span className="text-slate-400">•</span>
              <span className="text-amber-300 uppercase">{item.surface}</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              {spec.defaultRatingLabel} •{' '}
              <span className="text-sky-300">
                {canvasTool === 'select' ? 'Drag to move' : 'Drag to wire (+/-)'}
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
