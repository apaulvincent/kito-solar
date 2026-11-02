// src/components/diagram/useSurfaceNodeDrag.ts
import { useCallback, useRef } from 'react';
import { useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { clampAndSnapPosition } from '@/lib/layout3dEngine';
import { CanvasInteractionTool, MountCapability, MountSurface } from '@/types/layout3d';

interface UseSurfaceNodeDragParams {
  nodeId: string;
  meshRef: React.RefObject<THREE.Group | null>;
  position: [number, number, number];
  surface: MountSurface;
  capability: MountCapability;
  componentHeight: number;
  floorCenterY: number;
  canvasTool: CanvasInteractionTool;
  onLockControls?: (locked: boolean) => void;
  onWireStart?: (nodeId: string, clientX: number, clientY: number) => boolean;
  onClickSelect: () => void;
  onCommitMove: (position: [number, number, number], surface: MountSurface) => void;
}

const WALL_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

function clampOffset(val: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, val));
}

export function useSurfaceNodeDrag({
  nodeId,
  meshRef,
  position,
  surface,
  capability,
  componentHeight,
  floorCenterY,
  canvasTool,
  onLockControls,
  onWireStart,
  onClickSelect,
  onCommitMove,
}: UseSurfaceNodeDragParams) {
  const { camera, gl } = useThree();
  const isDraggingRef = useRef(false);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      // Only respond to primary mouse button / touch
      if (e.nativeEvent.button !== undefined && e.nativeEvent.button !== 0) return;
      e.stopPropagation();

      const startX = e.nativeEvent.clientX;
      const startY = e.nativeEvent.clientY;

      // In Wire modes, dragging from a component pulls a wire from its nearest matching terminal
      if (canvasTool !== 'select') {
        onWireStart?.(nodeId, startX, startY);
        return;
      }

      onLockControls?.(true);

      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorCenterY);
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();

      const getHits = (clientX: number, clientY: number) => {
        const rect = gl.domElement.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          return { wallHit: null, floorHit: null };
        }
        ndc.set(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          -((clientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(ndc, camera);

        const wVec = new THREE.Vector3();
        const fVec = new THREE.Vector3();
        const hasWall =
          Math.abs(raycaster.ray.direction.z) > 0.03 &&
          raycaster.ray.intersectPlane(WALL_PLANE, wVec) !== null;
        const hasFloor =
          Math.abs(raycaster.ray.direction.y) > 0.03 &&
          raycaster.ray.intersectPlane(floorPlane, fVec) !== null;

        return {
          wallHit: hasWall ? ([wVec.x, wVec.y, 0] as [number, number, number]) : null,
          floorHit: hasFloor ? ([fVec.x, floorCenterY, fVec.z] as [number, number, number]) : null,
        };
      };

      const startHits = getHits(startX, startY);
      const wallOffset: [number, number] =
        surface === 'wall' && startHits.wallHit
          ? [
              clampOffset(position[0] - startHits.wallHit[0], 1.2),
              clampOffset(position[1] - startHits.wallHit[1], 1.0),
            ]
          : [0, 0];

      const floorOffset: [number, number] =
        surface === 'floor' && startHits.floorHit
          ? [
              clampOffset(position[0] - startHits.floorHit[0], 2.0),
              clampOffset(position[2] - startHits.floorHit[2], 1.5),
            ]
          : [0, 0];

      let hasMoved = false;
      let latestPos: [number, number, number] = [...position];
      let latestSurface: MountSurface = surface;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!hasMoved && Math.hypot(dx, dy) < 5) return;

        hasMoved = true;
        isDraggingRef.current = true;
        document.body.style.cursor = 'grabbing';

        const hits = getHits(ev.clientX, ev.clientY);
        const adjustedWallHit: [number, number, number] | null = hits.wallHit
          ? [hits.wallHit[0] + wallOffset[0], hits.wallHit[1] + wallOffset[1], 0]
          : null;
        const adjustedFloorHit: [number, number, number] | null = hits.floorHit
          ? [hits.floorHit[0] + floorOffset[0], floorCenterY, hits.floorHit[2] + floorOffset[1]]
          : null;

        const snapped = clampAndSnapPosition({
          wallHit: adjustedWallHit,
          floorHit: adjustedFloorHit,
          capability,
          componentHeight,
          floorCenterY,
          snapToGrid: !ev.altKey,
        });

        latestPos = snapped.position;
        latestSurface = snapped.surface;

        if (meshRef.current) {
          meshRef.current.position.set(latestPos[0], latestPos[1], latestPos[2]);
        }
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        onLockControls?.(false);
        document.body.style.cursor = 'auto';

        if (!hasMoved) {
          isDraggingRef.current = false;
          onClickSelect();
        } else {
          isDraggingRef.current = false;
          onCommitMove(latestPos, latestSurface);
        }
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [
      nodeId,
      meshRef,
      position,
      surface,
      capability,
      componentHeight,
      floorCenterY,
      canvasTool,
      camera,
      gl,
      onLockControls,
      onWireStart,
      onClickSelect,
      onCommitMove,
    ]
  );

  return { handlePointerDown, isDraggingRef };
}
