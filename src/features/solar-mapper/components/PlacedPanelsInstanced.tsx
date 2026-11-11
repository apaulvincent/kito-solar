import React, { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { PlacedPanel } from '../types/solarMapper';
import { degToRad } from '../utils/geometryAngles';

// LOD-cull individual mounting rails above 400 modules to keep GPU draw cost low
const RAIL_LOD_PANEL_LIMIT = 400;

export const PlacedPanelsInstanced: React.FC<{ panels: PlacedPanel[] }> = React.memo(({ panels }) => {
  const glassRef = useRef<THREE.InstancedMesh>(null);
  const frameRef = useRef<THREE.InstancedMesh>(null);
  const gridRef = useRef<THREE.InstancedMesh>(null);
  const railsRef = useRef<THREE.InstancedMesh>(null);

  const count = panels.length;
  const includeRails = count > 0 && count <= RAIL_LOD_PANEL_LIMIT;

  useLayoutEffect(() => {
    if (count === 0) return;

    const dummy = new THREE.Object3D();
    const glassMesh = glassRef.current;
    const frameMesh = frameRef.current;
    const gridMesh = gridRef.current;
    const railsMesh = railsRef.current;

    let railIdx = 0;

    for (let i = 0; i < count; i++) {
      const p = panels[i];
      const rad = degToRad(p.rotationDeg || 0);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      if (frameMesh) {
        dummy.position.set(p.x, p.y, 0.118);
        dummy.rotation.set(0, 0, rad);
        dummy.scale.set(p.widthM + 0.02, p.lengthM + 0.02, 1);
        dummy.updateMatrix();
        frameMesh.setMatrixAt(i, dummy.matrix);
      }

      if (glassMesh) {
        dummy.position.set(p.x, p.y, 0.12);
        dummy.rotation.set(0, 0, rad);
        dummy.scale.set(p.widthM, p.lengthM, 1);
        dummy.updateMatrix();
        glassMesh.setMatrixAt(i, dummy.matrix);
      }

      if (gridMesh) {
        dummy.position.set(p.x, p.y, 0.139);
        dummy.rotation.set(0, 0, rad);
        dummy.scale.set(p.widthM * 0.96, p.lengthM * 0.96, 1);
        dummy.updateMatrix();
        gridMesh.setMatrixAt(i, dummy.matrix);
      }

      if (includeRails && railsMesh) {
        for (const sign of [-1, 1] as const) {
          const offsetX = -sin * (sign * p.lengthM * 0.25);
          const offsetY = cos * (sign * p.lengthM * 0.25);
          dummy.position.set(p.x + offsetX, p.y + offsetY, 0.105);
          dummy.rotation.set(0, 0, rad);
          dummy.scale.set(p.widthM * 0.95, 0.04, 0.025);
          dummy.updateMatrix();
          railsMesh.setMatrixAt(railIdx++, dummy.matrix);
        }
      }
    }

    if (glassMesh) glassMesh.instanceMatrix.needsUpdate = true;
    if (frameMesh) frameMesh.instanceMatrix.needsUpdate = true;
    if (gridMesh) gridMesh.instanceMatrix.needsUpdate = true;
    if (railsMesh && includeRails) railsMesh.instanceMatrix.needsUpdate = true;
  }, [panels, count, includeRails]);

  if (count === 0) return null;

  return (
    <group key={`instanced-panels-${count}`}>
      {includeRails && (
        <instancedMesh ref={railsRef} args={[undefined, undefined, count * 2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </instancedMesh>
      )}

      <instancedMesh ref={frameRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 0.03]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.9} />
      </instancedMesh>

      <instancedMesh
        ref={glassRef}
        args={[undefined, undefined, count]}
        castShadow={count < 300}
        receiveShadow
      >
        <boxGeometry args={[1, 1, 0.035]} />
        <meshStandardMaterial color="#0f2b48" roughness={0.15} metalness={0.85} />
      </instancedMesh>

      <instancedMesh ref={gridRef} args={[undefined, undefined, count]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#1d4ed8" transparent opacity={0.35} wireframe />
      </instancedMesh>
    </group>
  );
});
