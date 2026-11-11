import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { DiagramNodeKey } from '@/types/diagram';
import { MountSurface } from '@/types/layout3d';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import {
  BASE_NODE_SPECS,
  getNodeDimensions,
  isFloorMountedZ,
} from '@/lib/diagramNodeSpecs';
import { NodeGeometry } from './NodeGeometry';
import { NodeSelectionHalo } from './NodeSelectionHalo';
import { useSurfaceNodeDrag } from './useSurfaceNodeDrag';

interface DiagramNodeMeshProps {
  nodeKey: DiagramNodeKey;
  position: [number, number, number];
  onLockControls?: (locked: boolean) => void;
  onWireStart?: (nodeId: string, clientX: number, clientY: number) => boolean;
}

export function DiagramNodeMesh({
  nodeKey,
  position,
  onLockControls,
  onWireStart,
}: DiagramNodeMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const hoveredNodeKey = useCalculatorStore((s) => s.hoveredNodeKey);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const setHoveredNodeKey = useCalculatorStore((s) => s.setHoveredNodeKey);
  const moveBaseNode = useCalculatorStore((s) => s.moveBaseNode);
  const removeBaseNode = useCalculatorStore((s) => s.removeBaseNode);
  const canvasTool = useCalculatorStore((s) => s.canvasTool);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const gridVoltageV = useCalculatorStore((s) => s.gridVoltageV);

  const [hovered, setHovered] = useState(false);
  const isSelected = selectedNodeKey === nodeKey;
  const isHovered = hoveredNodeKey === nodeKey || hovered;
  const isAnyActive = Boolean(selectedNodeKey || hoveredNodeKey);
  const isDimmed = isAnyActive && !isSelected && !isHovered;

  const spec = BASE_NODE_SPECS[nodeKey];
  const dim = getNodeDimensions(spec.nodeType);
  const currentSurface: MountSurface = isFloorMountedZ(position[2]) ? 'floor' : 'wall';

  const { handlePointerDown, isDraggingRef } = useSurfaceNodeDrag({
    nodeId: nodeKey,
    meshRef,
    position,
    surface: currentSurface,
    capability: spec.capability,
    componentHeight: spec.height,
    floorCenterY: spec.floorCenterY,
    canvasTool,
    onLockControls,
    onWireStart,
    onClickSelect: () => setSelectedNodeKey(nodeKey),
    onCommitMove: (nextPos) => moveBaseNode(nodeKey, nextPos),
  });

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetScale = isSelected ? 1.15 : isHovered ? 1.08 : isDimmed ? 0.95 : 1.0;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 14);
  });

  const badgeRating = useMemo(
    () => spec.getBadgeRating(calculationResult, gridVoltageV),
    [spec, calculationResult, gridVoltageV]
  );

  return (
    <group
      ref={meshRef}
      position={position}
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        setHoveredNodeKey(nodeKey);
        if (!isDraggingRef.current) {
          document.body.style.cursor = canvasTool === 'select' ? 'grab' : 'crosshair';
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        setHoveredNodeKey(null);
        if (!isDraggingRef.current) {
          document.body.style.cursor = 'auto';
        }
      }}
    >
      <NodeGeometry
        nodeType={spec.nodeType}
        nodeKey={nodeKey}
        isSelected={isSelected}
        isHovered={isHovered}
      />

      {(isSelected || isHovered) && (
        <NodeSelectionHalo
          surface={dim.isWall ? 'wall' : 'floor'}
          width={dim.width}
          height={dim.height}
          isSelected={isSelected}
          floorRingColor={spec.color}
          floorRingYOffset={dim.floorRingYOffset}
        />
      )}

      {(isHovered || isSelected) && (
        <Html
          position={[0, dim.badgeYOffset + 0.35, 0]}
          center
          distanceFactor={16}
          zIndexRange={[15, 0]}
          className="pointer-events-auto select-none"
        >
          <div className="px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/95 text-white shadow-xl backdrop-blur-md whitespace-nowrap animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <div className="flex items-baseline gap-1.5 font-mono text-[11px]">
                  <span className="font-bold text-white tracking-tight">{spec.sceneLabel}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-300 font-semibold">{badgeRating}</span>
                </div>
              </div>
              {isSelected && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBaseNode(nodeKey);
                  }}
                  title={`Remove ${spec.sceneLabel} from 3D plant room (Del)`}
                  className="px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-mono text-[9px] font-bold cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="w-2 h-2 mx-auto rotate-45 border-b border-r border-slate-700/80 bg-slate-900/95 -mb-2.5 mt-1" />
          </div>
        </Html>
      )}
    </group>
  );
}
