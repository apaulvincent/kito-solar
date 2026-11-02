// src/components/diagram/CustomWireSystem.tsx
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { DiagramNodeKey } from '@/types/diagram';
import {
  ADDABLE_CATALOG_MAP,
  buildOrthogonalWireWaypoints,
  calculateWaypointsLengthMeters,
  findCompanionPairPort,
  findNearestSnapPortByRay,
  getNodeTerminalPorts,
} from '@/lib/layout3dEngine';
import { SnapCandidateResult, TerminalPort3D, WirePolarity } from '@/types/layout3d';
import { NodeType } from './NodeGeometry';

interface CustomWireSystemProps {
  nodePositions: Record<DiagramNodeKey, [number, number, number]>;
  isHybrid: boolean;
  isDark: boolean;
  isAnimationPaused?: boolean;
  onLockControls: (locked: boolean) => void;
  /** Mutable ref registered so DiagramNodeMesh / PlacedComponentMesh can start wire pulls in wire mode */
  wireStartTriggerRef?: React.MutableRefObject<
    ((nodeId: string, clientX: number, clientY: number) => boolean) | null
  >;
}

interface LiveWireDragState {
  sourcePort: TerminalPort3D;
  companionSourcePort: TerminalPort3D | null;
  polarity: WirePolarity;
  isTwinPair: boolean;
  cursorWorld: [number, number, number];
  snapCandidate: SnapCandidateResult | null;
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const WALL_PREVIEW_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.1);
const FLOOR_PREVIEW_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.25);

const BASE_NODE_META: { key: DiagramNodeKey; label: string; nodeType: NodeType; hybridOnly?: boolean }[] = [
  { key: 'pv_array', label: 'PV ARRAY', nodeType: 'pv' },
  { key: 'dc_isolator', label: 'DC ISOLATOR', nodeType: 'isolator' },
  { key: 'dc_breaker', label: 'DC BREAKER', nodeType: 'breaker' },
  { key: 'dc_spd', label: 'DC SPD', nodeType: 'spd' },
  { key: 'inverter', label: 'SOLAR INVERTER', nodeType: 'inverter' },
  { key: 'battery_breaker', label: 'BATTERY MCCB', nodeType: 'breaker', hybridOnly: true },
  { key: 'battery', label: 'BATTERY STORAGE', nodeType: 'battery', hybridOnly: true },
  { key: 'ac_breaker', label: 'AC BREAKER', nodeType: 'breaker' },
  { key: 'ac_spd', label: 'AC SPD', nodeType: 'spd' },
  { key: 'ac_isolator', label: 'AC ISOLATOR', nodeType: 'isolator' },
  { key: 'main_panel', label: 'MAIN PANEL', nodeType: 'panel' },
  { key: 'ats', label: 'ATS SWITCH', nodeType: 'ats' },
  { key: 'grid', label: 'UTILITY GRID', nodeType: 'grid' },
  { key: 'load', label: 'BUILDING LOAD', nodeType: 'load' },
  { key: 'grounding', label: 'GROUND BUSBAR', nodeType: 'grounding' },
];

function WirePolylineSegments({
  waypoints,
  color,
  radius,
  emissive = '#000000',
  emissiveIntensity = 0,
  opacity = 1,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  waypoints: [number, number, number][];
  color: string;
  radius: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  onClick?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: () => void;
}) {
  if (waypoints.length < 2) return null;

  return (
    <group
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {waypoints.slice(0, -1).map((p1, idx) => {
        const p2 = waypoints[idx + 1];
        const start = new THREE.Vector3(...p1);
        const end = new THREE.Vector3(...p2);
        const dir = new THREE.Vector3().subVectors(end, start);
        const dist = dir.length();
        if (dist <= 0.001) return null;

        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          Y_AXIS,
          dir.clone().normalize()
        );

        return (
          <group key={`wseg-${idx}`} position={midpoint} quaternion={quaternion}>
            <mesh castShadow>
              <cylinderGeometry args={[radius, radius, dist, 12]} />
              <meshStandardMaterial
                color={color}
                roughness={0.38}
                metalness={0.22}
                emissive={emissive}
                emissiveIntensity={emissiveIntensity}
                transparent={opacity < 1}
                opacity={opacity}
              />
            </mesh>
            {/* Invisible thicker hit cylinder when interactive */}
            {onClick && (
              <mesh visible={false}>
                <cylinderGeometry args={[radius * 2.8, radius * 2.8, dist, 8]} />
                <meshBasicMaterial />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Molded cable bend elbows */}
      {waypoints.slice(1, -1).map((pt, idx) => (
        <mesh key={`welbow-${idx}`} position={pt}>
          <sphereGeometry args={[radius * 1.12, 10, 10]} />
          <meshStandardMaterial
            color={color}
            roughness={0.38}
            metalness={0.22}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            transparent={opacity < 1}
            opacity={opacity}
          />
        </mesh>
      ))}

      {/* Crimp terminal boots at both ends */}
      {[waypoints[0], waypoints[waypoints.length - 1]].map((endPt, idx) => (
        <mesh key={`wboot-${idx}`} position={endPt}>
          <cylinderGeometry args={[radius * 1.35, radius * 1.35, 0.045, 10]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

export function CustomWireSystem({
  nodePositions,
  isHybrid,
  isDark,
  isAnimationPaused = false,
  onLockControls,
  wireStartTriggerRef,
}: CustomWireSystemProps) {
  const { camera, gl } = useThree();
  const layout3d = useCalculatorStore((s) => s.layout3d);
  const canvasTool = useCalculatorStore((s) => s.canvasTool);
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const hoveredNodeKey = useCalculatorStore((s) => s.hoveredNodeKey);
  const selectedCustomNodeId = useCalculatorStore((s) => s.selectedCustomNodeId);
  const selectedWireId = useCalculatorStore((s) => s.selectedWireId);
  const setSelectedWireId = useCalculatorStore((s) => s.setSelectedWireId);
  const addWireConnection = useCalculatorStore((s) => s.addWireConnection);
  const setPolarityAlertMessage = useCalculatorStore((s) => s.setPolarityAlertMessage);

  const [hoveredPortKey, setHoveredPortKey] = useState<string | null>(null);
  const [hoveredWireId, setHoveredWireId] = useState<string | null>(null);
  const [liveDrag, setLiveDrag] = useState<LiveWireDragState | null>(null);
  const liveDragRef = useRef<LiveWireDragState | null>(null);

  const isWireMode =
    canvasTool === 'wire_pos' || canvasTool === 'wire_neg' || canvasTool === 'wire_pair';

  // Compute all 3D terminal ports across active baseline nodes and custom placed nodes
  const allPorts = useMemo<TerminalPort3D[]>(() => {
    const ports: TerminalPort3D[] = [];

    for (const meta of BASE_NODE_META) {
      if (meta.hybridOnly && !isHybrid) continue;
      const pos = nodePositions[meta.key];
      if (!pos) continue;
      ports.push(...getNodeTerminalPorts(meta.key, meta.label, meta.nodeType, pos));
    }

    for (const placed of layout3d.placedComponents) {
      const spec = ADDABLE_CATALOG_MAP.get(placed.catalogKey);
      const nodeType: NodeType = spec?.nodeType || 'breaker';
      ports.push(...getNodeTerminalPorts(placed.id, placed.label, nodeType, placed.position));
    }

    return ports;
  }, [nodePositions, isHybrid, layout3d.placedComponents]);

  const portLookup = useMemo(() => {
    const map = new Map<string, TerminalPort3D>();
    for (const p of allPorts) {
      map.set(`${p.nodeId}::${p.portId}`, p);
    }
    return map;
  }, [allPorts]);

  const portsByNode = useMemo(() => {
    const map = new Map<string, TerminalPort3D[]>();
    for (const p of allPorts) {
      const list = map.get(p.nodeId) || [];
      list.push(p);
      map.set(p.nodeId, list);
    }
    return map;
  }, [allPorts]);

  const projectCursorWorld = useCallback(
    (raycaster: THREE.Raycaster, fallbackOrigin: [number, number, number]): [number, number, number] => {
      const wallVec = new THREE.Vector3();
      const floorVec = new THREE.Vector3();
      const hitWall = raycaster.ray.intersectPlane(WALL_PREVIEW_PLANE, wallVec);
      const hitFloor = raycaster.ray.intersectPlane(FLOOR_PREVIEW_PLANE, floorVec);

      if (fallbackOrigin[2] > 0.6 && hitFloor && floorVec.z > 0.3) {
        return [
          Number(floorVec.x.toFixed(2)),
          0.35,
          Number(floorVec.z.toFixed(2)),
        ];
      }
      if (hitWall && wallVec.y >= 0.05 && wallVec.y <= 7.2) {
        return [
          Number(wallVec.x.toFixed(2)),
          Number(wallVec.y.toFixed(2)),
          0.12,
        ];
      }
      if (hitFloor) {
        return [
          Number(floorVec.x.toFixed(2)),
          0.35,
          Number(Math.max(0.2, floorVec.z).toFixed(2)),
        ];
      }
      return fallbackOrigin;
    },
    []
  );

  const beginWirePullFromPort = useCallback(
    (port: TerminalPort3D) => {
      const desiredPolarity: WirePolarity =
        canvasTool === 'wire_pos'
          ? 'positive'
          : canvasTool === 'wire_neg'
          ? 'negative'
          : canvasTool === 'wire_pair'
          ? 'positive'
          : port.polarity;

      const nodePorts = portsByNode.get(port.nodeId) || [port];
      const resolvedPrimaryPort =
        port.polarity === desiredPolarity
          ? port
          : findCompanionPairPort(port, nodePorts) || port;

      const effectivePolarity =
        canvasTool === 'select' ? port.polarity : resolvedPrimaryPort.polarity;
      const isTwin = canvasTool === 'wire_pair';
      const companion = isTwin
        ? findCompanionPairPort(resolvedPrimaryPort, nodePorts)
        : null;

      const initial: LiveWireDragState = {
        sourcePort: resolvedPrimaryPort,
        companionSourcePort: companion,
        polarity: effectivePolarity,
        isTwinPair: isTwin,
        cursorWorld: resolvedPrimaryPort.worldPosition,
        snapCandidate: null,
      };

      setPolarityAlertMessage(null);
      liveDragRef.current = initial;
      setLiveDrag(initial);
      onLockControls(true);
    },
    [canvasTool, portsByNode, onLockControls, setPolarityAlertMessage]
  );

  // Allow clicking/dragging anywhere on a node in Wire mode to start pulling from its nearest matching terminal
  useEffect(() => {
    if (!wireStartTriggerRef) return;
    wireStartTriggerRef.current = (nodeId: string, clientX: number, clientY: number) => {
      if (!isWireMode) return false;
      const nodePorts = portsByNode.get(nodeId);
      if (!nodePorts || nodePorts.length === 0) return false;

      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, camera);

      const targetPol: WirePolarity = canvasTool === 'wire_neg' ? 'negative' : 'positive';
      const candidates = nodePorts.filter((p) => p.polarity === targetPol);
      const pool = candidates.length > 0 ? candidates : nodePorts;

      let best = pool[0];
      let bestDist = Infinity;
      const tmpVec = new THREE.Vector3();
      for (const p of pool) {
        tmpVec.set(p.worldPosition[0], p.worldPosition[1], p.worldPosition[2]);
        const d = raycaster.ray.distanceToPoint(tmpVec);
        if (d < bestDist) {
          bestDist = d;
          best = p;
        }
      }

      beginWirePullFromPort(best);
      return true;
    };

    return () => {
      if (wireStartTriggerRef) wireStartTriggerRef.current = null;
    };
  }, [wireStartTriggerRef, isWireMode, portsByNode, gl, camera, canvasTool, beginWirePullFromPort]);

  // Global window pointermove / pointerup listener while pulling a wire
  useEffect(() => {
    if (!liveDrag) return;

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const handlePointerMove = (ev: PointerEvent) => {
      const current = liveDragRef.current;
      if (!current) return;

      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      ndc.set(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);

      const snap = findNearestSnapPortByRay({
        rayOrigin: [camera.position.x, camera.position.y, camera.position.z],
        rayDirection: [
          raycaster.ray.direction.x,
          raycaster.ray.direction.y,
          raycaster.ray.direction.z,
        ],
        allPorts,
        sourceNodeId: current.sourcePort.nodeId,
        wirePolarity: current.polarity,
      });

      const nextCursor = snap
        ? snap.port.worldPosition
        : projectCursorWorld(raycaster, current.sourcePort.worldPosition);

      const nextState: LiveWireDragState = {
        ...current,
        cursorWorld: nextCursor,
        snapCandidate: snap,
      };
      liveDragRef.current = nextState;
      setLiveDrag(nextState);
    };

    const handlePointerUp = () => {
      const finished = liveDragRef.current;
      liveDragRef.current = null;
      setLiveDrag(null);
      onLockControls(false);
      document.body.style.cursor = 'auto';

      if (!finished || !finished.snapCandidate) return;

      const { sourcePort, companionSourcePort, polarity, isTwinPair, snapCandidate } = finished;
      if (snapCandidate.polarityMismatch) {
        setPolarityAlertMessage(
          `Reverse polarity blocked: cannot wire ${
            polarity === 'positive' ? 'Positive (+)' : 'Negative (-)'
          } terminal to ${snapCandidate.port.nodeLabel} ${snapCandidate.port.label}.`
        );
        return;
      }

      const primaryRes = addWireConnection({
        polarity,
        fromNodeId: sourcePort.nodeId,
        fromPortId: sourcePort.portId,
        toNodeId: snapCandidate.port.nodeId,
        toPortId: snapCandidate.port.portId,
        fromWorldPos: sourcePort.worldPosition,
        toWorldPos: snapCandidate.port.worldPosition,
      });

      if (!primaryRes.ok && primaryRes.error) {
        setPolarityAlertMessage(primaryRes.error);
        return;
      }

      if (isTwinPair && companionSourcePort) {
        const targetNodePorts = portsByNode.get(snapCandidate.port.nodeId) || [];
        const companionTarget = findCompanionPairPort(snapCandidate.port, targetNodePorts);
        if (
          companionTarget &&
          companionTarget.polarity === companionSourcePort.polarity
        ) {
          addWireConnection({
            polarity: companionSourcePort.polarity,
            fromNodeId: companionSourcePort.nodeId,
            fromPortId: companionSourcePort.portId,
            toNodeId: companionTarget.nodeId,
            toPortId: companionTarget.portId,
            fromWorldPos: companionSourcePort.worldPosition,
            toWorldPos: companionTarget.worldPosition,
          });
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [
    Boolean(liveDrag),
    allPorts,
    portsByNode,
    camera,
    gl,
    projectCursorWorld,
    addWireConnection,
    onLockControls,
    setPolarityAlertMessage,
  ]);

  // Compute rendered wire paths + animated current flow particles
  const renderedWires = useMemo(() => {
    return layout3d.wires.map((wire) => {
      const fromPort = portLookup.get(`${wire.fromNodeId}::${wire.fromPortId}`);
      const toPort = portLookup.get(`${wire.toNodeId}::${wire.toPortId}`);

      const fallbackFrom =
        (nodePositions as Record<string, [number, number, number]>)[wire.fromNodeId] ||
        layout3d.placedComponents.find((c) => c.id === wire.fromNodeId)?.position;
      const fallbackTo =
        (nodePositions as Record<string, [number, number, number]>)[wire.toNodeId] ||
        layout3d.placedComponents.find((c) => c.id === wire.toNodeId)?.position;

      const pStart = fromPort?.worldPosition || fallbackFrom;
      const pEnd = toPort?.worldPosition || fallbackTo;
      if (!pStart || !pEnd) return null;

      const waypoints = buildOrthogonalWireWaypoints(pStart, pEnd, wire.polarity);
      const lengthMeters = calculateWaypointsLengthMeters(waypoints);

      return {
        wire,
        waypoints,
        lengthMeters,
        fromLabel: fromPort ? `${fromPort.nodeLabel} ${fromPort.label}` : wire.fromNodeId,
        toLabel: toPort ? `${toPort.nodeLabel} ${toPort.label}` : wire.toNodeId,
      };
    }).filter(Boolean) as {
      wire: (typeof layout3d.wires)[number];
      waypoints: [number, number, number][];
      lengthMeters: number;
      fromLabel: string;
      toLabel: string;
    }[];
  }, [layout3d.wires, layout3d.placedComponents, portLookup, nodePositions]);

  // Animated pulse beads along custom wires
  const pulseMeshRef = useRef<THREE.InstancedMesh>(null);
  const pulseDummy = useMemo(() => new THREE.Object3D(), []);
  const wirePulses = useMemo(() => {
    const items: {
      wireIdx: number;
      phase: number;
      polarity: WirePolarity;
      segments: { a: [number, number, number]; b: [number, number, number]; len: number; cumStart: number; cumEnd: number }[];
      totalDist: number;
    }[] = [];

    renderedWires.forEach((rw, wIdx) => {
      let cum = 0;
      const segs = [];
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
  }, [renderedWires]);

  useEffect(() => {
    if (!pulseMeshRef.current || wirePulses.length === 0) return;
    const c = new THREE.Color();
    wirePulses.forEach((wp, idx) => {
      c.set(wp.polarity === 'positive' ? '#EF4444' : '#38BDF8');
      pulseMeshRef.current!.setColorAt(idx, c);
    });
    if (pulseMeshRef.current.instanceColor) {
      pulseMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [wirePulses]);

  useFrame((state) => {
    if (!pulseMeshRef.current || wirePulses.length === 0 || isAnimationPaused) return;
    const t = state.clock.getElapsedTime();

    for (let i = 0; i < wirePulses.length; i++) {
      const wp = wirePulses[i];
      const progress = (wp.phase + (t * 0.85) / wp.totalDist) % 1.0;
      const target = progress * wp.totalDist;
      let seg = wp.segments[0];
      for (let s = 0; s < wp.segments.length; s++) {
        if (target >= wp.segments[s].cumStart && target <= wp.segments[s].cumEnd) {
          seg = wp.segments[s];
          break;
        }
      }
      const u = seg.len > 0 ? Math.max(0, Math.min(1, (target - seg.cumStart) / seg.len)) : 0;
      pulseDummy.position.set(
        seg.a[0] + u * (seg.b[0] - seg.a[0]),
        seg.a[1] + u * (seg.b[1] - seg.a[1]),
        seg.a[2] + u * (seg.b[2] - seg.a[2]) + 0.028
      );
      pulseDummy.scale.setScalar(1.0);
      pulseDummy.updateMatrix();
      pulseMeshRef.current.setMatrixAt(i, pulseDummy.matrix);
    }
    pulseMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Live preview waypoints
  const previewPrimaryWaypoints = useMemo(() => {
    if (!liveDrag) return [];
    return buildOrthogonalWireWaypoints(
      liveDrag.sourcePort.worldPosition,
      liveDrag.cursorWorld,
      liveDrag.polarity
    );
  }, [liveDrag]);

  const previewCompanionWaypoints = useMemo(() => {
    if (!liveDrag || !liveDrag.isTwinPair || !liveDrag.companionSourcePort) return [];
    let endPos: [number, number, number] = [
      liveDrag.cursorWorld[0] + 0.16,
      liveDrag.cursorWorld[1],
      liveDrag.cursorWorld[2],
    ];
    if (liveDrag.snapCandidate && !liveDrag.snapCandidate.polarityMismatch) {
      const targetPorts = portsByNode.get(liveDrag.snapCandidate.port.nodeId) || [];
      const compTarget = findCompanionPairPort(liveDrag.snapCandidate.port, targetPorts);
      if (compTarget) endPos = compTarget.worldPosition;
    }
    return buildOrthogonalWireWaypoints(
      liveDrag.companionSourcePort.worldPosition,
      endPos,
      liveDrag.companionSourcePort.polarity
    );
  }, [liveDrag, portsByNode]);

  // Visible terminal ports: all ports in wire mode or during active wire pull; selected/hovered node ports in select mode
  const visiblePorts = useMemo(() => {
    if (isWireMode || liveDrag) return allPorts;
    return allPorts.filter(
      (p) =>
        p.nodeId === selectedCustomNodeId ||
        p.nodeId === selectedNodeKey ||
        p.nodeId === hoveredNodeKey
    );
  }, [allPorts, isWireMode, liveDrag, selectedCustomNodeId, selectedNodeKey, hoveredNodeKey]);

  return (
    <group>
      {/* 1. Saved Positive (+) Red & Negative (-) Black Wire Runs */}
      {renderedWires.map(({ wire, waypoints, lengthMeters, fromLabel, toLabel }) => {
        const isSelected = selectedWireId === wire.id;
        const isHovered = hoveredWireId === wire.id;
        const baseColor =
          wire.polarity === 'positive'
            ? '#DC2626'
            : isDark
            ? '#1E293B'
            : '#0F172A';
        const displayColor = isSelected
          ? '#F59E0B'
          : isHovered
          ? wire.polarity === 'positive'
            ? '#EF4444'
            : '#475569'
          : baseColor;
        const midPoint = waypoints[Math.floor(waypoints.length / 2)] || waypoints[0];

        return (
          <group key={wire.id}>
            <WirePolylineSegments
              waypoints={waypoints}
              color={displayColor}
              radius={isSelected ? 0.036 : isHovered ? 0.032 : 0.026}
              emissive={
                isSelected
                  ? '#F59E0B'
                  : wire.polarity === 'positive'
                  ? '#7F1D1D'
                  : '#334155'
              }
              emissiveIntensity={isSelected ? 0.55 : isHovered ? 0.35 : 0.18}
              onClick={(e) => {
                if (isWireMode) return;
                e.stopPropagation();
                setSelectedWireId(wire.id);
              }}
              onPointerOver={(e) => {
                if (isWireMode) return;
                e.stopPropagation();
                setHoveredWireId(wire.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredWireId(null);
                document.body.style.cursor = 'auto';
              }}
            />

            {(isSelected || isHovered) && midPoint && (
              <Html
                position={[midPoint[0], midPoint[1] + 0.28, midPoint[2]]}
                center
                distanceFactor={15}
                zIndexRange={[18, 0]}
                className="pointer-events-none select-none"
              >
                <div className="px-2.5 py-1 rounded-md bg-slate-900/95 border border-slate-700 text-white text-[10px] font-mono whitespace-nowrap shadow-lg">
                  <span
                    className={
                      wire.polarity === 'positive' ? 'text-red-400 font-bold' : 'text-slate-300 font-bold'
                    }
                  >
                    {wire.polarity === 'positive' ? '(+) RED' : '(-) BLACK'}
                  </span>{' '}
                  • {lengthMeters}m • {fromLabel} → {toLabel}
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Animated Current Flow Beads on Custom Wires */}
      {wirePulses.length > 0 && (
        <instancedMesh
          key={`custom-pulses-${wirePulses.length}`}
          ref={pulseMeshRef}
          args={[undefined, undefined, wirePulses.length]}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.042, 10, 10]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      )}

      {/* 2. Live Dragging Wire Preview + Magnetic Snap Indicator */}
      {liveDrag && previewPrimaryWaypoints.length >= 2 && (
        <group>
          <WirePolylineSegments
            waypoints={previewPrimaryWaypoints}
            color={
              liveDrag.snapCandidate?.polarityMismatch
                ? '#F59E0B'
                : liveDrag.polarity === 'positive'
                ? '#EF4444'
                : '#334155'
            }
            radius={0.03}
            emissive={
              liveDrag.snapCandidate?.polarityMismatch
                ? '#EF4444'
                : liveDrag.polarity === 'positive'
                ? '#EF4444'
                : '#38BDF8'
            }
            emissiveIntensity={0.6}
            opacity={0.92}
          />

          {previewCompanionWaypoints.length >= 2 && (
            <WirePolylineSegments
              waypoints={previewCompanionWaypoints}
              color="#1E293B"
              radius={0.028}
              emissive="#38BDF8"
              emissiveIntensity={0.45}
              opacity={0.88}
            />
          )}

          {/* Magnetic Snap Ring & Floating Status Pill */}
          {liveDrag.snapCandidate && (
            <group position={liveDrag.snapCandidate.port.worldPosition}>
              <mesh>
                <ringGeometry args={[0.11, 0.16, 24]} />
                <meshBasicMaterial
                  color={liveDrag.snapCandidate.polarityMismatch ? '#EF4444' : '#22C55E'}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <Html
                position={[0, 0.32, 0]}
                center
                distanceFactor={14}
                zIndexRange={[25, 0]}
                className="pointer-events-none select-none"
              >
                <div
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold whitespace-nowrap shadow-xl ${
                    liveDrag.snapCandidate.polarityMismatch
                      ? 'bg-red-950/95 border-red-500 text-red-200'
                      : 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
                  }`}
                >
                  {liveDrag.snapCandidate.polarityMismatch
                    ? `SHORT CIRCUIT BLOCKED: ${liveDrag.snapCandidate.port.nodeLabel} ${liveDrag.snapCandidate.port.label}`
                    : liveDrag.isTwinPair
                    ? `SNAP (+/-) PAIR: ${liveDrag.snapCandidate.port.nodeLabel}`
                    : `SNAP: ${liveDrag.snapCandidate.port.nodeLabel} • ${liveDrag.snapCandidate.port.label}`}
                </div>
              </Html>
            </group>
          )}
        </group>
      )}

      {/* 3. Physical 3D Positive (+) Red & Negative (-) Black Terminal Lugs */}
      {visiblePorts.map((port) => {
        const key = `${port.nodeId}::${port.portId}`;
        const isPos = port.polarity === 'positive';
        const isPortHovered = hoveredPortKey === key;
        const isSnapTarget =
          liveDrag?.snapCandidate?.port.nodeId === port.nodeId &&
          liveDrag?.snapCandidate?.port.portId === port.portId;
        const isSource =
          liveDrag?.sourcePort.nodeId === port.nodeId &&
          liveDrag?.sourcePort.portId === port.portId;

        const lugScale = isSnapTarget || isSource ? 1.45 : isPortHovered ? 1.3 : isWireMode ? 1.15 : 0.9;

        return (
          <group
            key={key}
            position={port.worldPosition}
            scale={[lugScale, lugScale, lugScale]}
            onPointerDown={(e) => {
              e.stopPropagation();
              beginWirePullFromPort(port);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredPortKey(key);
              document.body.style.cursor = 'crosshair';
            }}
            onPointerOut={() => {
              setHoveredPortKey((prev) => (prev === key ? null : prev));
              if (!liveDragRef.current) {
                document.body.style.cursor = 'auto';
              }
            }}
          >
            {/* Outer Metallic Crimp Collar */}
            <mesh>
              <cylinderGeometry args={[0.068, 0.068, 0.032, 16]} />
              <meshStandardMaterial
                color={isPos ? '#FCA5A5' : '#94A3B8'}
                metalness={0.85}
                roughness={0.22}
              />
            </mesh>

            {/* Color-Coded Insulated Terminal Stud: Red (+) / Black (-) */}
            <mesh>
              <sphereGeometry args={[0.056, 14, 14]} />
              <meshStandardMaterial
                color={isPos ? '#EF4444' : '#0F172A'}
                emissive={isPos ? '#DC2626' : '#334155'}
                emissiveIntensity={isWireMode || isPortHovered ? 0.55 : 0.25}
                roughness={0.3}
                metalness={0.2}
              />
            </mesh>

            {/* Larger invisible pointer hit sphere for effortless grabbing */}
            <mesh visible={false}>
              <sphereGeometry args={[isWireMode ? 0.17 : 0.11, 8, 8]} />
              <meshBasicMaterial />
            </mesh>

            {isPortHovered && !liveDrag && (
              <Html
                position={[0, 0.22, 0]}
                center
                distanceFactor={14}
                zIndexRange={[20, 0]}
                className="pointer-events-none select-none"
              >
                <div className="px-2 py-0.5 rounded bg-slate-900/95 border border-slate-700 text-[9px] font-mono font-bold text-white whitespace-nowrap shadow-md">
                  <span className={isPos ? 'text-red-400' : 'text-sky-300'}>
                    {port.label}
                  </span>{' '}
                  • Drag to wire
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
