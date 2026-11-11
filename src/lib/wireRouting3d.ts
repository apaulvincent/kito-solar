import { DiagramNodeKey } from '@/types/diagram';
import {
  Layout3DState,
  PlacedComponent3D,
  SnapCandidateResult,
  TerminalPort3D,
  WireConnection3D,
  WirePolarity,
} from '@/types/layout3d';
import {
  ADDABLE_CATALOG_MAP,
  BASE_NODE_SPECS,
  getHalfSizeForNodeType,
  getNodeTypeFromKey,
  isFloorMountedZ,
} from './diagramNodeSpecs';
import { NodeType } from '@/types/layout3d';

export interface WallObstacle2D {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface WireRouteOptions {
  fromDir?: 1 | -1;
  toDir?: 1 | -1;
  obstacles?: WallObstacle2D[];
  routeOffset?: [number, number];
}

export function getLocalPortsForNodeType(
  nodeType: NodeType
): { portId: string; label: string; polarity: WirePolarity; offset: [number, number, number] }[] {
  switch (nodeType) {
    case 'breaker':
      return [
        { portId: 'in_pos', label: 'IN (+)', polarity: 'positive', offset: [-0.15, 0.52, 0.18] },
        { portId: 'in_neg', label: 'IN (-)', polarity: 'negative', offset: [0.15, 0.52, 0.18] },
        { portId: 'out_pos', label: 'OUT (+)', polarity: 'positive', offset: [-0.16, -0.52, 0.18] },
        { portId: 'gnd', label: 'GND', polarity: 'ground', offset: [0.0, -0.52, 0.18] },
        { portId: 'out_neg', label: 'OUT (-)', polarity: 'negative', offset: [0.16, -0.52, 0.18] },
      ];
    case 'isolator':
      return [
        { portId: 'in_pos', label: 'LINE (+)', polarity: 'positive', offset: [-0.18, 0.56, 0.18] },
        { portId: 'in_neg', label: 'LINE (-)', polarity: 'negative', offset: [0.18, 0.56, 0.18] },
        { portId: 'out_pos', label: 'LOAD (+)', polarity: 'positive', offset: [-0.18, -0.56, 0.18] },
        { portId: 'gnd', label: 'GND', polarity: 'ground', offset: [0.0, -0.56, 0.18] },
        { portId: 'out_neg', label: 'LOAD (-)', polarity: 'negative', offset: [0.18, -0.56, 0.18] },
      ];
    case 'spd':
      return [
        { portId: 'in_pos', label: 'SPD (+)', polarity: 'positive', offset: [-0.18, 0.5, 0.18] },
        { portId: 'in_neg', label: 'SPD (-)', polarity: 'negative', offset: [0.18, 0.5, 0.18] },
        { portId: 'gnd', label: 'SPD GND', polarity: 'ground', offset: [0.0, -0.5, 0.18] },
      ];
    case 'ats':
      return [
        { portId: 'in_pos', label: 'SRC (+)', polarity: 'positive', offset: [-0.22, 0.65, 0.2] },
        { portId: 'in_neg', label: 'SRC (-)', polarity: 'negative', offset: [0.22, 0.65, 0.2] },
        { portId: 'out_pos', label: 'LOAD (+)', polarity: 'positive', offset: [-0.24, -0.65, 0.2] },
        { portId: 'gnd', label: 'ATS GND', polarity: 'ground', offset: [0.0, -0.65, 0.2] },
        { portId: 'out_neg', label: 'LOAD (-)', polarity: 'negative', offset: [0.24, -0.65, 0.2] },
      ];
    case 'inverter':
      return [
        { portId: 'pv_pos', label: 'PV (+)', polarity: 'positive', offset: [-0.56, -0.91, 0.18] },
        { portId: 'pv_neg', label: 'PV (-)', polarity: 'negative', offset: [-0.38, -0.91, 0.18] },
        { portId: 'bat_pos', label: 'BAT (+)', polarity: 'positive', offset: [-0.14, -0.91, 0.18] },
        { portId: 'bat_neg', label: 'BAT (-)', polarity: 'negative', offset: [0.06, -0.91, 0.18] },
        { portId: 'ac_pos', label: 'AC L (+)', polarity: 'positive', offset: [0.3, -0.91, 0.18] },
        { portId: 'ac_neg', label: 'AC N (-)', polarity: 'negative', offset: [0.48, -0.91, 0.18] },
        { portId: 'gnd', label: 'PE GND', polarity: 'ground', offset: [0.64, -0.91, 0.18] },
      ];
    case 'battery':
      return [
        { portId: 'bat_pos', label: 'BAT (+)', polarity: 'positive', offset: [-0.28, 0.81, 0.18] },
        { portId: 'gnd', label: 'PE GND', polarity: 'ground', offset: [0.0, 0.81, 0.18] },
        { portId: 'bat_neg', label: 'BAT (-)', polarity: 'negative', offset: [0.28, 0.81, 0.18] },
      ];
    case 'panel':
      return [
        { portId: 'in_pos', label: 'BUS L (+)', polarity: 'positive', offset: [-0.24, 0.86, 0.18] },
        { portId: 'in_neg', label: 'BUS N (-)', polarity: 'negative', offset: [0.24, 0.86, 0.18] },
        { portId: 'out_pos', label: 'FEED (+)', polarity: 'positive', offset: [-0.26, -0.86, 0.18] },
        { portId: 'gnd', label: 'PE GND', polarity: 'ground', offset: [0.0, -0.86, 0.18] },
        { portId: 'out_neg', label: 'FEED (-)', polarity: 'negative', offset: [0.26, -0.86, 0.18] },
      ];
    case 'pv':
      return [
        { portId: 'pv_pos', label: 'STRING (+)', polarity: 'positive', offset: [-0.24, 0.24, -0.56] },
        { portId: 'gnd', label: 'FRAME GND', polarity: 'ground', offset: [0.0, 0.24, -0.56] },
        { portId: 'pv_neg', label: 'STRING (-)', polarity: 'negative', offset: [0.24, 0.24, -0.56] },
      ];
    case 'grounding':
      return [
        { portId: 'gnd_1', label: 'EARTH GND', polarity: 'ground', offset: [-0.26, 0.12, 0.08] },
        { portId: 'gnd_2', label: 'EQUIP GND', polarity: 'ground', offset: [0.0, 0.12, 0.08] },
        { portId: 'gnd_3', label: 'BOND GND', polarity: 'ground', offset: [0.26, 0.12, 0.08] },
      ];
    case 'grid':
      return [
        { portId: 'grid_pos', label: 'GRID L (+)', polarity: 'positive', offset: [-0.2, 0.35, 0.24] },
        { portId: 'grid_neg', label: 'GRID N (-)', polarity: 'negative', offset: [0.2, 0.35, 0.24] },
      ];
    case 'load':
      return [
        { portId: 'load_pos', label: 'LOAD L (+)', polarity: 'positive', offset: [-0.24, 0.18, -0.86] },
        { portId: 'load_neg', label: 'LOAD N (-)', polarity: 'negative', offset: [0.24, 0.18, -0.86] },
      ];
    default:
      return [
        { portId: 'pos', label: '(+)', polarity: 'positive', offset: [-0.15, -0.45, 0.18] },
        { portId: 'gnd', label: 'GND', polarity: 'ground', offset: [0.0, -0.45, 0.18] },
        { portId: 'neg', label: '(-)', polarity: 'negative', offset: [0.15, -0.45, 0.18] },
      ];
  }
}

export function getNodeTerminalPorts(
  nodeId: string,
  nodeLabel: string,
  nodeType: NodeType,
  position: [number, number, number]
): TerminalPort3D[] {
  return getLocalPortsForNodeType(nodeType).map((p) => ({
    portId: p.portId,
    nodeId,
    nodeLabel,
    label: p.label,
    polarity: p.polarity,
    localOffset: p.offset,
    worldPosition: [
      Number((position[0] + p.offset[0]).toFixed(3)),
      Number((position[1] + p.offset[1]).toFixed(3)),
      Number((position[2] + p.offset[2]).toFixed(3)),
    ],
  }));
}

export function resolveNodeTypeAndLabel(
  nodeId: string,
  placedComponents: PlacedComponent3D[]
): { nodeType: NodeType; label: string } {
  const custom = placedComponents.find((c) => c.id === nodeId);
  if (custom) {
    const spec = ADDABLE_CATALOG_MAP.get(custom.catalogKey);
    return {
      nodeType: spec?.nodeType || 'breaker',
      label: custom.label,
    };
  }
  const baseSpec = BASE_NODE_SPECS[nodeId as DiagramNodeKey];
  return {
    nodeType: getNodeTypeFromKey(nodeId),
    label: baseSpec?.wireLabel || nodeId.toUpperCase().replace(/_/g, ' '),
  };
}

export function findNearestSnapPortByRay(params: {
  rayOrigin: [number, number, number];
  rayDirection: [number, number, number];
  allPorts: TerminalPort3D[];
  sourceNodeId: string;
  wirePolarity: WirePolarity;
  snapRadius?: number;
}): SnapCandidateResult | null {
  const { rayOrigin, rayDirection, allPorts, sourceNodeId, wirePolarity, snapRadius } = params;

  const dLen = Math.hypot(rayDirection[0], rayDirection[1], rayDirection[2]);
  if (dLen <= 1e-6) return null;
  const dxUnit = rayDirection[0] / dLen;
  const dyUnit = rayDirection[1] / dLen;
  const dzUnit = rayDirection[2] / dLen;

  let bestMatching: { port: TerminalPort3D; perpDist: number; score: number } | null = null;
  let bestOpposite: { port: TerminalPort3D; perpDist: number; score: number } | null = null;

  for (const port of allPorts) {
    if (port.nodeId === sourceNodeId) continue;

    const vx = port.worldPosition[0] - rayOrigin[0];
    const vy = port.worldPosition[1] - rayOrigin[1];
    const vz = port.worldPosition[2] - rayOrigin[2];

    const t = vx * dxUnit + vy * dyUnit + vz * dzUnit;
    if (t <= 0.1) continue;

    const cx = rayOrigin[0] + t * dxUnit;
    const cy = rayOrigin[1] + t * dyUnit;
    const cz = rayOrigin[2] + t * dzUnit;

    const perpDist = Math.hypot(
      port.worldPosition[0] - cx,
      port.worldPosition[1] - cy,
      port.worldPosition[2] - cz
    );

    const effectiveRadius = snapRadius ?? Math.min(0.95, Math.max(0.42, t * 0.048));
    if (perpDist <= effectiveRadius) {
      const score = perpDist + t * 0.008;
      if (port.polarity === wirePolarity) {
        if (!bestMatching || score < bestMatching.score) {
          bestMatching = { port, perpDist, score };
        }
      } else if (!bestOpposite || score < bestOpposite.score) {
        bestOpposite = { port, perpDist, score };
      }
    }
  }

  if (
    bestOpposite &&
    bestOpposite.perpDist < 0.22 &&
    (!bestMatching || bestOpposite.perpDist + 0.12 < bestMatching.perpDist)
  ) {
    return {
      port: bestOpposite.port,
      distance: Number(bestOpposite.perpDist.toFixed(3)),
      polarityMismatch: true,
    };
  }

  if (bestMatching) {
    return {
      port: bestMatching.port,
      distance: Number(bestMatching.perpDist.toFixed(3)),
      polarityMismatch: false,
    };
  }

  if (bestOpposite && bestOpposite.perpDist < 0.34) {
    return {
      port: bestOpposite.port,
      distance: Number(bestOpposite.perpDist.toFixed(3)),
      polarityMismatch: true,
    };
  }

  return null;
}

export function getWallObstacles(
  nodePositions: Record<string, [number, number, number]>,
  defaultPositions: Record<DiagramNodeKey, [number, number, number]>,
  placedComponents: PlacedComponent3D[],
  isHybrid = true,
  removedBaseNodes: DiagramNodeKey[] = []
): WallObstacle2D[] {
  const obstacles: WallObstacle2D[] = [];
  const baseKeys = Object.keys(defaultPositions) as DiagramNodeKey[];
  const removedSet = new Set(removedBaseNodes);

  for (const key of baseKeys) {
    if (removedSet.has(key)) continue;
    if (!isHybrid && (key === 'battery' || key === 'battery_breaker')) continue;
    if (key === 'eps_breaker') continue;
    const pos = nodePositions[key] || defaultPositions[key];
    if (!pos || isFloorMountedZ(pos[2])) continue;
    const [hw, hh] = getHalfSizeForNodeType(getNodeTypeFromKey(key));
    obstacles.push({
      id: key,
      minX: Number((pos[0] - hw).toFixed(3)),
      maxX: Number((pos[0] + hw).toFixed(3)),
      minY: Number((pos[1] - hh).toFixed(3)),
      maxY: Number((pos[1] + hh).toFixed(3)),
    });
  }

  for (const placed of placedComponents) {
    if (isFloorMountedZ(placed.position[2])) continue;
    const spec = ADDABLE_CATALOG_MAP.get(placed.catalogKey);
    const [hw, hh] = getHalfSizeForNodeType(spec?.nodeType || 'breaker');
    obstacles.push({
      id: placed.id,
      minX: Number((placed.position[0] - hw).toFixed(3)),
      maxX: Number((placed.position[0] + hw).toFixed(3)),
      minY: Number((placed.position[1] - hh).toFixed(3)),
      maxY: Number((placed.position[1] + hh).toFixed(3)),
    });
  }

  return obstacles;
}

function segmentHitsObstacle(
  xa: number,
  ya: number,
  xb: number,
  yb: number,
  obs: WallObstacle2D
): boolean {
  const minSegX = Math.min(xa, xb);
  const maxSegX = Math.max(xa, xb);
  const minSegY = Math.min(ya, yb);
  const maxSegY = Math.max(ya, yb);
  const eps = 0.03;

  if (Math.abs(ya - yb) < 0.01) {
    if (ya <= obs.minY + eps || ya >= obs.maxY - eps) return false;
    return maxSegX > obs.minX + eps && minSegX < obs.maxX - eps;
  }

  if (Math.abs(xa - xb) < 0.01) {
    if (xa <= obs.minX + eps || xa >= obs.maxX - eps) return false;
    return maxSegY > obs.minY + eps && minSegY < obs.maxY - eps;
  }

  return false;
}

function countRouteHits(pts: [number, number][], obstacles: WallObstacle2D[]): number {
  let hits = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [xa, ya] = pts[i];
    const [xb, yb] = pts[i + 1];
    if (Math.hypot(xb - xa, yb - ya) < 0.01) continue;
    for (const obs of obstacles) {
      if (segmentHitsObstacle(xa, ya, xb, yb, obs)) {
        hits++;
      }
    }
  }
  return hits;
}

function compute2DRouteLength(pts: [number, number][]): number {
  let len = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    len += Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]);
  }
  return len;
}

export function buildOrthogonalWireWaypoints(
  fromPos: [number, number, number],
  toPos: [number, number, number],
  polarity: WirePolarity,
  options?: WireRouteOptions
): [number, number, number][] {
  const laneOffsetZ =
    polarity === 'positive' ? 0.048 : polarity === 'negative' ? 0.022 : 0.008;
  const laneOffsetY =
    polarity === 'positive' ? 0.035 : polarity === 'negative' ? -0.035 : -0.085;
  const laneOffsetX =
    polarity === 'positive' ? -0.048 : polarity === 'negative' ? 0.048 : 0.0;

  const [x1, y1, z1] = fromPos;
  const [x2, y2, z2] = toPos;
  const [userOffsetX, userOffsetY] = options?.routeOffset || [0, 0];

  const fromFloor = isFloorMountedZ(z1);
  const toFloor = isFloorMountedZ(z2);

  if (!fromFloor && !toFloor) {
    const routeZ = Number((Math.max(z1, z2) + laneOffsetZ).toFixed(3));
    const dx = Math.abs(x2 - x1);

    const stubClearance =
      polarity === 'positive' ? 0.16 : polarity === 'negative' ? 0.23 : 0.29;
    const fromDir: 1 | -1 = options?.fromDir ?? (y1 >= y2 ? -1 : 1);
    const toDir: 1 | -1 = options?.toDir ?? (y2 > y1 ? -1 : 1);

    const stubY1 = Number((y1 + fromDir * stubClearance).toFixed(3));
    const stubY2 = Number((y2 + toDir * stubClearance).toFixed(3));
    const obstacles = options?.obstacles || [];

    if (dx < 0.04 && countRouteHits([[x1, y1], [x2, y2]], obstacles) === 0) {
      return [
        fromPos,
        [x1, y1, routeZ],
        [x2, y2, routeZ],
        toPos,
      ];
    }

    const candidates: { pts: [number, number][]; kind: 'h-channel' | 'v-riser' }[] = [];

    const rawChanYs: number[] = [
      (stubY1 + stubY2) / 2 + laneOffsetY,
      Math.min(stubY1, stubY2) + (polarity === 'positive' ? 0.0 : polarity === 'negative' ? -0.06 : -0.12),
      Math.max(stubY1, stubY2) + (polarity === 'positive' ? 0.1 : polarity === 'negative' ? 0.04 : -0.02),
      0.36 + laneOffsetY,
    ];
    for (const obs of obstacles) {
      rawChanYs.push(obs.minY - stubClearance, obs.maxY + stubClearance);
    }

    for (const rawY of rawChanYs) {
      const chanY = Number(Math.max(0.22, Math.min(6.5, rawY)).toFixed(3));
      const validStart = (chanY - y1) * fromDir >= 0.08;
      const validEnd = (chanY - y2) * toDir >= 0.08;
      if (validStart && validEnd) {
        candidates.push({
          kind: 'h-channel',
          pts: [
            [x1, y1],
            [x1, chanY],
            [x2, chanY],
            [x2, y2],
          ],
        });
      }
    }

    const rawMidXs: number[] = [
      (x1 + x2) / 2 + laneOffsetX,
      x1 - 0.56 + laneOffsetX,
      x1 + 0.56 + laneOffsetX,
      x2 - 0.56 + laneOffsetX,
      x2 + 0.56 + laneOffsetX,
    ];
    for (const obs of obstacles) {
      rawMidXs.push(obs.minX - 0.18 + laneOffsetX, obs.maxX + 0.18 + laneOffsetX);
    }

    for (const rawX of rawMidXs) {
      const midX = Number(rawX.toFixed(3));
      candidates.push({
        kind: 'v-riser',
        pts: [
          [x1, y1],
          [x1, stubY1],
          [midX, stubY1],
          [midX, stubY2],
          [x2, stubY2],
          [x2, y2],
        ],
      });
    }

    let best = candidates[0] || {
      kind: 'v-riser' as const,
      pts: [
        [x1, y1],
        [x1, stubY1],
        [Number(((x1 + x2) / 2 + laneOffsetX).toFixed(3)), stubY1],
        [Number(((x1 + x2) / 2 + laneOffsetX).toFixed(3)), stubY2],
        [x2, stubY2],
        [x2, y2],
      ],
    };
    let bestScore = Infinity;

    for (const cand of candidates) {
      const hits = countRouteHits(cand.pts, obstacles);
      const len = compute2DRouteLength(cand.pts);
      const bendPenalty = cand.pts.length * 0.12;
      const score = hits * 1000 + len + bendPenalty;
      if (score < bestScore) {
        bestScore = score;
        best = cand;
      }
    }

    const final2D = best.pts.map((pt) => [pt[0], pt[1]] as [number, number]);
    if (Math.abs(userOffsetX) > 0.001 || Math.abs(userOffsetY) > 0.001) {
      if (best.kind === 'h-channel' && final2D.length === 4) {
        const shiftedY = Number(Math.max(0.18, Math.min(6.5, final2D[1][1] + userOffsetY)).toFixed(3));
        final2D[1][1] = shiftedY;
        final2D[2][1] = shiftedY;
      } else if (final2D.length >= 6) {
        const shiftedX = Number((final2D[2][0] + userOffsetX).toFixed(3));
        const shiftedY1 = Number(Math.max(0.18, Math.min(6.5, final2D[1][1] + userOffsetY)).toFixed(3));
        const shiftedY2 = Number(Math.max(0.18, Math.min(6.5, final2D[4][1] + userOffsetY)).toFixed(3));
        final2D[1][1] = shiftedY1;
        final2D[2][0] = shiftedX;
        final2D[2][1] = shiftedY1;
        final2D[3][0] = shiftedX;
        final2D[3][1] = shiftedY2;
        final2D[4][1] = shiftedY2;
      }
    }

    return [
      fromPos,
      ...final2D.map(([px, py]) => [px, py, routeZ] as [number, number, number]),
      toPos,
    ];
  }

  const baseFloorTrayY =
    polarity === 'positive' ? 0.12 : polarity === 'negative' ? 0.08 : 0.04;
  const floorTrayY = Number(Math.max(0.04, baseFloorTrayY + userOffsetY * 0.25).toFixed(3));
  const wallDropZ = Number((0.18 + laneOffsetZ).toFixed(3));

  if (!fromFloor && toFloor) {
    const riserX = Number((x1 + userOffsetX).toFixed(3));
    return [
      fromPos,
      [x1, y1, wallDropZ],
      [riserX, y1, wallDropZ],
      [riserX, floorTrayY, wallDropZ],
      [riserX, floorTrayY, z2],
      [x2, floorTrayY, z2],
      toPos,
    ];
  }

  if (fromFloor && !toFloor) {
    if (y2 > 2.0) {
      const baseRiserX =
        x1 < x2
          ? x2 - (polarity === 'positive' ? 0.56 : polarity === 'negative' ? 0.48 : 0.64)
          : x2 + (polarity === 'positive' ? 0.48 : polarity === 'negative' ? 0.56 : 0.64);
      const riserX = Number((baseRiserX + userOffsetX).toFixed(3));
      const arriveY = Number(
        (y2 + (polarity === 'positive' ? 0.18 : polarity === 'negative' ? 0.11 : 0.25) + userOffsetY).toFixed(3)
      );
      return [
        fromPos,
        [x1, floorTrayY, z1],
        [riserX, floorTrayY, z1],
        [riserX, floorTrayY, wallDropZ],
        [riserX, arriveY, wallDropZ],
        [x2, arriveY, wallDropZ],
        [x2, y2, wallDropZ],
        toPos,
      ];
    }
    const riserX = Number((x2 + userOffsetX).toFixed(3));
    return [
      fromPos,
      [x1, floorTrayY, z1],
      [riserX, floorTrayY, z1],
      [riserX, floorTrayY, wallDropZ],
      [x2, y2, wallDropZ],
      toPos,
    ];
  }

  return [
    fromPos,
    [x1, floorTrayY, z1],
    [x2, floorTrayY, z1],
    [x2, floorTrayY, z2],
    toPos,
  ];
}

export function calculateWaypointsLengthMeters(waypoints: [number, number, number][]): number {
  if (waypoints.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    total += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  }
  // Include 10% termination slack, minimum 0.5m
  return Math.max(0.5, Number((total * 1.1).toFixed(2)));
}

export function routeAndMeasureWire(params: {
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  polarity: WirePolarity;
  fromNodePos: [number, number, number];
  toNodePos: [number, number, number];
  placedComponents: PlacedComponent3D[];
  obstacles: WallObstacle2D[];
  routeOffset?: [number, number];
}): { waypoints: [number, number, number][]; lengthMeters: number } {
  const {
    fromNodeId,
    fromPortId,
    toNodeId,
    toPortId,
    polarity,
    fromNodePos,
    toNodePos,
    placedComponents,
    obstacles,
    routeOffset,
  } = params;

  const fromMeta = resolveNodeTypeAndLabel(fromNodeId, placedComponents);
  const toMeta = resolveNodeTypeAndLabel(toNodeId, placedComponents);

  const fromPortObj = getNodeTerminalPorts(
    fromNodeId,
    fromMeta.label,
    fromMeta.nodeType,
    fromNodePos
  ).find((p) => p.portId === fromPortId);
  const toPortObj = getNodeTerminalPorts(
    toNodeId,
    toMeta.label,
    toMeta.nodeType,
    toNodePos
  ).find((p) => p.portId === toPortId);

  const fromPort = fromPortObj?.worldPosition || fromNodePos;
  const toPort = toPortObj?.worldPosition || toNodePos;

  const waypoints = buildOrthogonalWireWaypoints(fromPort, toPort, polarity, {
    fromDir: fromPortObj ? (fromPortObj.localOffset[1] >= 0 ? 1 : -1) : undefined,
    toDir: toPortObj ? (toPortObj.localOffset[1] >= 0 ? 1 : -1) : undefined,
    obstacles,
    routeOffset,
  });

  return {
    waypoints,
    lengthMeters: calculateWaypointsLengthMeters(waypoints),
  };
}

export function findCompanionPairPort(
  selectedPort: TerminalPort3D,
  nodePorts: TerminalPort3D[]
): TerminalPort3D | null {
  const targetPolarity: WirePolarity = selectedPort.polarity === 'positive' ? 'negative' : 'positive';
  const prefix = selectedPort.portId.replace(/_(pos|neg)$/, '');

  return (
    nodePorts.find((p) => p.polarity === targetPolarity && p.portId.startsWith(prefix)) ||
    nodePorts.find((p) => p.polarity === targetPolarity) ||
    null
  );
}

export function measureLayoutWires(
  layout3d: Layout3DState,
  defaultPositions: Record<DiagramNodeKey, [number, number, number]>
): WireConnection3D[] {
  const mergedBasePositions: Record<string, [number, number, number]> = {
    ...defaultPositions,
    ...(layout3d.baseNodePositions as Record<string, [number, number, number]>),
  };
  const obstacles = getWallObstacles(
    mergedBasePositions,
    defaultPositions,
    layout3d.placedComponents,
    true,
    layout3d.removedBaseNodes || []
  );

  return layout3d.wires.map((wire) => {
    const customFrom = layout3d.placedComponents.find((c) => c.id === wire.fromNodeId)?.position;
    const customTo = layout3d.placedComponents.find((c) => c.id === wire.toNodeId)?.position;
    const fromNodePos = customFrom || mergedBasePositions[wire.fromNodeId];
    const toNodePos = customTo || mergedBasePositions[wire.toNodeId];
    if (!fromNodePos || !toNodePos) return wire;

    const { lengthMeters } = routeAndMeasureWire({
      fromNodeId: wire.fromNodeId,
      fromPortId: wire.fromPortId,
      toNodeId: wire.toNodeId,
      toPortId: wire.toPortId,
      polarity: wire.polarity,
      fromNodePos,
      toNodePos,
      placedComponents: layout3d.placedComponents,
      obstacles,
      routeOffset: wire.routeOffset,
    });

    return { ...wire, lengthMeters };
  });
}
