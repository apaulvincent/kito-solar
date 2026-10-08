// src/components/diagram/SolarScene.tsx
import { useMemo } from 'react';
import { OrbitControls, Grid } from '@react-three/drei';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { DiagramNodeKey, CableConnection } from '@/types/diagram';
import { DiagramNodeMesh } from './DiagramNodeMesh';
import { PowerFlowCables } from './PowerFlowCables';

interface SolarSceneProps {
  isAnimationPaused?: boolean;
}

export function SolarScene({ isAnimationPaused = false }: SolarSceneProps) {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const isHybrid = calculationResult.systemType === 'hybrid' && calculationResult.battery.hasBattery;

  // Clear horizontal coordinates along the electrical flow
  const nodePositions = useMemo<Record<DiagramNodeKey, [number, number, number]>>(() => {
    return {
      pv_array: [-11, 0, 0],
      dc_breaker: [-8, 0, 0],
      dc_isolator: [-5.8, 0, 0],
      dc_spd: [-4, 0, -1.8],
      dc_conduit: [-5, 0, 1.2],
      inverter: [-1.8, 0, 0],
      battery: [-1.8, 0, 4.2],
      battery_breaker: [-1.8, 0, 2.1],
      battery_wire: [-2.6, 0, 3.2],
      ac_breaker: [1.8, 0, 0],
      ac_isolator: [4, 0, 0],
      ac_spd: [1.8, 0, -1.8],
      ats: [6.4, 0, 0],
      eps_breaker: [4.8, 0, 2.2],
      main_panel: [9.2, 0, 0],
      grid: [12.2, 0, -1.6],
      load: [12.2, 0, 1.6],
      grounding: [0, 0, -3.5],
    };
  }, []);

  // Cable connections between nodes
  const cables = useMemo<CableConnection[]>(() => {
    const list: CableConnection[] = [
      // DC Generation to Inverter
      { id: 'c-pv-brk', from: 'pv_array', to: 'dc_breaker', type: 'dc', color: '#D97706' },
      { id: 'c-brk-iso', from: 'dc_breaker', to: 'dc_isolator', type: 'dc', color: '#D97706' },
      { id: 'c-iso-inv', from: 'dc_isolator', to: 'inverter', type: 'dc', color: '#D97706' },
      { id: 'c-dc-spd', from: 'dc_isolator', to: 'dc_spd', type: 'dc', color: '#D97706' },

      // AC Inverter to Main Panel
      { id: 'c-inv-acbrk', from: 'inverter', to: 'ac_breaker', type: 'ac', color: '#0284C7' },
      { id: 'c-acbrk-iso', from: 'ac_breaker', to: 'ac_isolator', type: 'ac', color: '#0284C7' },
      { id: 'c-ac-spd', from: 'ac_breaker', to: 'ac_spd', type: 'ac', color: '#0284C7' },
      { id: 'c-iso-ats', from: 'ac_isolator', to: 'ats', type: 'ac', color: '#0284C7' },
      { id: 'c-ats-panel', from: 'ats', to: 'main_panel', type: 'ac', color: '#0284C7' },

      // Distribution
      { id: 'c-panel-grid', from: 'main_panel', to: 'grid', type: 'ac', color: '#64748B', bidirectional: true },
      { id: 'c-panel-load', from: 'main_panel', to: 'load', type: 'ac', color: '#0284C7' },
    ];

    if (isHybrid) {
      list.push(
        { id: 'c-inv-batbrk', from: 'inverter', to: 'battery_breaker', type: 'battery', color: '#059669', bidirectional: true },
        { id: 'c-batbrk-bat', from: 'battery_breaker', to: 'battery', type: 'battery', color: '#059669', bidirectional: true }
      );
    }

    return list;
  }, [isHybrid]);

  const theme = useCalculatorStore((s) => s.theme);
  const isDark = theme === 'dark';

  return (
    <>
      {/* Studio Lighting */}
      <color attach="background" args={[isDark ? '#090D16' : '#F8FAFC']} />
      <ambientLight intensity={isDark ? 0.85 : 1.15} />
      <directionalLight
        position={[15, 25, 20]}
        intensity={isDark ? 1.6 : 1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-15, 18, -10]} intensity={isDark ? 0.7 : 0.6} />

      {/* Architectural Floor Grid */}
      <Grid
        position={[0, -0.65, 0]}
        args={[36, 24]}
        cellSize={1}
        cellThickness={0.8}
        cellColor={isDark ? '#1E293B' : '#E2E8F0'}
        sectionSize={4}
        sectionThickness={1.2}
        sectionColor={isDark ? '#334155' : '#CBD5E1'}
        fadeDistance={28}
        fadeStrength={1.2}
      />

      {/* DC Side Nodes */}
      <DiagramNodeMesh
        nodeKey="pv_array"
        label="PV ARRAY"
        sublabel={`${calculationResult.summary.totalPanels}x Modules`}
        position={nodePositions.pv_array}
        color="#0284C7"
        nodeType="pv"
      />
      <DiagramNodeMesh
        nodeKey="dc_breaker"
        label="DC BREAKER"
        sublabel={`${calculationResult.dc.breakerRatingA}A`}
        position={nodePositions.dc_breaker}
        color="#DC2626"
        nodeType="breaker"
      />
      <DiagramNodeMesh
        nodeKey="dc_isolator"
        label="DC ISOLATOR"
        sublabel={`${calculationResult.dc.isolatorRatingA}A`}
        position={nodePositions.dc_isolator}
        color="#D97706"
        nodeType="isolator"
      />
      <DiagramNodeMesh
        nodeKey="dc_spd"
        label="DC SPD"
        sublabel={calculationResult.dc.spdRating}
        position={nodePositions.dc_spd}
        color="#059669"
        nodeType="spd"
      />

      {/* Central Solar Inverter */}
      <DiagramNodeMesh
        nodeKey="inverter"
        label="SOLAR INVERTER"
        sublabel={`${calculationResult.summary.inverterPowerKw} kW ${calculationResult.systemType.toUpperCase()}`}
        position={nodePositions.inverter}
        color="#D97706"
        nodeType="inverter"
      />

      {/* Hybrid Battery Nodes */}
      {isHybrid && (
        <>
          <DiagramNodeMesh
            nodeKey="battery_breaker"
            label="BATTERY MCCB"
            sublabel={`${calculationResult.battery.recommendedBreakerA}A`}
            position={nodePositions.battery_breaker}
            color="#059669"
            nodeType="breaker"
          />
          <DiagramNodeMesh
            nodeKey="battery"
            label="BATTERY STORAGE"
            sublabel={`${(calculationResult.battery.totalEnergyWh / 1000).toFixed(1)} kWh`}
            position={nodePositions.battery}
            color="#059669"
            nodeType="battery"
          />
        </>
      )}

      {/* AC Distribution Nodes */}
      <DiagramNodeMesh
        nodeKey="ac_breaker"
        label="AC BREAKER"
        sublabel={`${calculationResult.ac.breakerRatingA}A`}
        position={nodePositions.ac_breaker}
        color="#0284C7"
        nodeType="breaker"
      />
      <DiagramNodeMesh
        nodeKey="ac_isolator"
        label="AC ISOLATOR"
        sublabel={`${calculationResult.ac.isolatorRatingA}A`}
        position={nodePositions.ac_isolator}
        color="#D97706"
        nodeType="isolator"
      />
      <DiagramNodeMesh
        nodeKey="ac_spd"
        label="AC SPD"
        sublabel={calculationResult.ac.spdRating}
        position={nodePositions.ac_spd}
        color="#059669"
        nodeType="spd"
      />
      <DiagramNodeMesh
        nodeKey="ats"
        label="ATS"
        sublabel={calculationResult.ac.atsConfigured ? `${calculationResult.ac.atsRatingA}A` : 'BYPASS'}
        position={nodePositions.ats}
        color="#7C3AED"
        nodeType="breaker"
      />
      <DiagramNodeMesh
        nodeKey="main_panel"
        label="MAIN PANEL"
        sublabel="Distribution"
        position={nodePositions.main_panel}
        color="#475569"
        nodeType="panel"
      />
      <DiagramNodeMesh
        nodeKey="grid"
        label="UTILITY GRID"
        sublabel={`${useCalculatorStore.getState().gridVoltageV}V AC`}
        position={nodePositions.grid}
        color="#64748B"
        nodeType="grid"
      />
      <DiagramNodeMesh
        nodeKey="load"
        label="BUILDING LOAD"
        sublabel="Consumer Circuit"
        position={nodePositions.load}
        color="#0284C7"
        nodeType="load"
      />

      {/* Real-time Busbars / Cables */}
      <PowerFlowCables
        cables={cables}
        nodePositions={nodePositions}
        isAnimationPaused={isAnimationPaused}
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={6}
        maxDistance={35}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
}
