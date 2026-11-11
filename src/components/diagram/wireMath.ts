import * as THREE from 'three';
import { TerminalPort3D, WirePolarity } from '@/types/layout3d';
import { isFloorMountedZ } from '@/lib/diagramNodeSpecs';

export const Y_AXIS = new THREE.Vector3(0, 1, 0);
export const WALL_PREVIEW_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.1);
export const FLOOR_PREVIEW_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.25);

export interface WirePulseSegment {
  a: [number, number, number];
  b: [number, number, number];
  len: number;
  cumStart: number;
  cumEnd: number;
}

export interface WirePulseItem {
  wireIdx: number;
  phase: number;
  polarity: WirePolarity;
  segments: WirePulseSegment[];
  totalDist: number;
}

export function projectRayCursorToPlantWorld(
  ray: THREE.Ray,
  fallbackOrigin: [number, number, number]
): [number, number, number] {
  const wallVec = new THREE.Vector3();
  const floorVec = new THREE.Vector3();
  const hitWall = ray.intersectPlane(WALL_PREVIEW_PLANE, wallVec);
  const hitFloor = ray.intersectPlane(FLOOR_PREVIEW_PLANE, floorVec);

  if (isFloorMountedZ(fallbackOrigin[2]) && hitFloor && floorVec.z > 0.3) {
    return [Number(floorVec.x.toFixed(2)), 0.35, Number(floorVec.z.toFixed(2))];
  }
  if (hitWall && wallVec.y >= 0.05 && wallVec.y <= 7.2) {
    return [Number(wallVec.x.toFixed(2)), Number(wallVec.y.toFixed(2)), 0.12];
  }
  if (hitFloor) {
    return [Number(floorVec.x.toFixed(2)), 0.35, Number(Math.max(0.2, floorVec.z).toFixed(2))];
  }
  return fallbackOrigin;
}

export function pickNearestPortToRay(
  ray: THREE.Ray,
  nodePorts: TerminalPort3D[],
  desiredPolarity: WirePolarity
): TerminalPort3D {
  const candidates = nodePorts.filter((p) => p.polarity === desiredPolarity);
  const pool = candidates.length > 0 ? candidates : nodePorts;

  let best = pool[0];
  let bestDist = Infinity;
  const tmpVec = new THREE.Vector3();
  for (const p of pool) {
    tmpVec.set(p.worldPosition[0], p.worldPosition[1], p.worldPosition[2]);
    const d = ray.distanceToPoint(tmpVec);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

export function buildWirePulses(
  wires: ReadonlyArray<{
    wire: { polarity: WirePolarity; fromNodeId: string; toNodeId: string };
    waypoints: [number, number, number][];
  }>,
  atsSource: 'solar' | 'utility'
): WirePulseItem[] {
  const items: WirePulseItem[] = [];
  const solarAcNodes = new Set(['ac_breaker', 'ac_spd', 'ac_isolator']);

  wires.forEach((rw, wIdx) => {
    // Grounding conductors carry fault current only, so no idle animation beads are rendered.
    if (rw.wire.polarity === 'ground') return;

    const { fromNodeId, toNodeId } = rw.wire;
    const isUtilityFeed = fromNodeId === 'grid' || toNodeId === 'grid';
    const isSolarAcFeed = solarAcNodes.has(fromNodeId) || solarAcNodes.has(toNodeId);

    if (atsSource === 'utility' && isSolarAcFeed) return;
    if (atsSource === 'solar' && isUtilityFeed) return;

    let cum = 0;
    const segs: WirePulseSegment[] = [];
    for (let i = 0; i < rw.waypoints.length - 1; i++) {
      const a = rw.waypoints[i];
      const b = rw.waypoints[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      if (len > 0.001) {
        segs.push({ a, b, len, cumStart: cum, cumEnd: cum + len });
        cum += len;
      }
    }
    if (cum <= 0.01) return;

    const beadCount = Math.max(2, Math.min(6, Math.round(cum * 1.1)));
    for (let b = 0; b < beadCount; b++) {
      items.push({
        wireIdx: wIdx,
        phase: b / beadCount,
        polarity: rw.wire.polarity,
        segments: segs,
        totalDist: cum,
      });
    }
  });

  return items;
}

export function stepWirePulses(
  mesh: THREE.InstancedMesh,
  pulses: WirePulseItem[],
  elapsedTime: number,
  dummy: THREE.Object3D
): void {
  for (let i = 0; i < pulses.length; i++) {
    const wp = pulses[i];
    const rawProgress = (wp.phase + (elapsedTime * 0.85) / wp.totalDist) % 1.0;
    const progress = wp.polarity === 'negative' ? (1.0 - rawProgress + 1.0) % 1.0 : rawProgress;
    const target = progress * wp.totalDist;
    let seg = wp.segments[0];
    for (let s = 0; s < wp.segments.length; s++) {
      if (target >= wp.segments[s].cumStart && target <= wp.segments[s].cumEnd) {
        seg = wp.segments[s];
        break;
      }
    }
    const u = seg.len > 0 ? Math.max(0, Math.min(1, (target - seg.cumStart) / seg.len)) : 0;
    dummy.position.set(
      seg.a[0] + u * (seg.b[0] - seg.a[0]),
      seg.a[1] + u * (seg.b[1] - seg.a[1]),
      seg.a[2] + u * (seg.b[2] - seg.a[2]) + 0.028
    );
    dummy.scale.setScalar(1.0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}
