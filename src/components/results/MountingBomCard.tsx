import { useState } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Hammer, Info, Maximize2, X, ShieldCheck, Wrench, Ruler, Award } from 'lucide-react';
import { MountingItem } from '@/types/calculator';
import { formatPeso } from '@/lib/utils';
import { Modal } from '@/components/common/Modal';
import { CadDimensionDrawing } from './MountingCadDiagram';

interface TechnicalSpecDetail {
  dimensions: string;
  material: string;
  hardware: string;
  torque: string;
  loadRating: string;
  corrosion: string;
  standard: string;
}

const ACCESSORY_TECHNICAL_DATA: Record<string, TechnicalSpecDetail> = {
  roof_rail: {
    dimensions: '2200 × 28 × 40 mm (Length × Width × Height), 1.3 mm wall profile',
    material: 'High-Tensile Structural Aluminum Alloy (AL6005-T5)',
    hardware: 'Compatible with standard M8 T-bolts, mid clamps, and end clamps',
    torque: '15–18 N·m (L-foot attachment)',
    loadRating: 'Wind Load: up to 60 m/s | Snow Load: up to 1.4 kN/m²',
    corrosion: 'Clear anodized surface finish, film thickness ≥ 10 µm',
    standard: 'AS/NZS 1170.2, UL 2703, Eurocode 9, ISO 9001 certified',
  },
  rail_splice: {
    dimensions: '150 × 22 × 32 mm internal slide-in structural connector bar',
    material: 'AL6005-T5 High-Strength Extrusion + SUS304 Grounding Bonding Pins',
    hardware: '2× M6 SUS304 Hex Socket Bolts + Grounding Pins',
    torque: '9–12 N·m (fastener torque)',
    loadRating: 'Bending Moment Capacity: 95% of uninterrupted rail section',
    corrosion: 'Internal hidden mounting protects fasteners from weather exposure',
    standard: 'UL 2703 Equipotential Bonding, IEC 61215, IBC 2021',
  },
  l_foot: {
    dimensions: '84 × 40 × 40 mm (Height × Base Width × Depth), 5.0 mm thickness',
    material: 'Anodized Aluminum AL6005-T5 with 3.0 mm EPDM isolation pad',
    hardware: 'M8 × 25 mm SUS304 Hex Flange Bolt, Spring Washer, 6.3×80 mm Lag Bolt',
    torque: '15–18 N·m (M8) / 10–12 N·m (Lag bolt into purlin)',
    loadRating: 'Uplift Resistance: ≥ 3.8 kN per bracket point',
    corrosion: 'UV-resistant vulcanized EPDM gasket prevents galvanic corrosion',
    standard: 'UL 2703, AS/NZS 1170.2, CE approved',
  },
  mid_clamp: {
    dimensions: '40 × 35 × 28 mm clamping plate, fits 30–40 mm module frame heights',
    material: 'Anodized Extruded Aluminum AL6005-T5 + SUS304 Grounding Star Clip',
    hardware: 'M8 × 45 mm Socket Head Cap Screw (Hex 6 mm drive), Stainless Washer, T-Nut',
    torque: '15–18 N·m (ensures frame grounding continuity)',
    loadRating: 'Clamping Force: ≥ 4.2 kN per module interface',
    corrosion: 'Dual grounding teeth pierce frame anodization for UL 467 bonding',
    standard: 'UL 467, UL 2703 Class A fire & grounding certified',
  },
  end_clamp: {
    dimensions: '40 × 35 × 38 mm clamping jaw, stepped Z-profile matching frame height',
    material: 'Anodized Aluminum AL6005-T5 with grooved anti-slip gripping face',
    hardware: 'M8 × 30 mm SUS304 Socket Head Cap Screw & Aluminum T-Nut slider',
    torque: '15–18 N·m',
    loadRating: 'Edge Wind Uplift Resistance: ≥ 3.5 kN',
    corrosion: 'Salt spray resistance > 1000 hours per ASTM B117',
    standard: 'AS/NZS 1170.2, UL 2703 Class A, TUV Rheinland certified',
  },
  grounding_lug: {
    dimensions: '32 × 16 × 24 mm (Lug Body) | 150 × 20 mm Braided Stainless Strap',
    material: 'High-Conductivity Tin-Plated Copper (Lug) & SUS304 Stainless Steel (Jumper)',
    hardware: 'M8 SUS304 Hex Bolt & Serrated Flange Nut (Rail) + M6 SS Bolt (Jumper) + Hex Set Screw',
    torque: '8–10 N·m (terminal clamp wire screw) | 15–18 N·m (M8 rail bolt)',
    loadRating: 'Short-Circuit Fault Current: 5000 A for 5 sec (UL 467) | Wire: 14 AWG to 4 AWG',
    corrosion: 'Electro-tin plating eliminates galvanic reaction between copper conductor and aluminum rail',
    standard: 'UL 467 Grounding/Bonding, UL 2703 Class A, NEC 690.43 compliant',
  },
  mc4: {
    dimensions: '58 × 19 mm (mated pair length: ~88 mm), cable OD 4.0–6.0 mm²',
    material: 'Flame Retardant PPO/PC (UL94-V0) with tinned copper contact pins',
    hardware: 'Snap-in locking mechanism, silicone internal sealing gasket',
    torque: '2.5–3.0 N·m on compression sealing nut gland',
    loadRating: 'Nominal Voltage: 1500 V DC | Rated Current: 30–45 A continuous',
    corrosion: 'IP68 waterproof rating (1m immersion for 24h), UV resistant',
    standard: 'IEC 62852:2014, UL 6703 certified',
  },
};

export function MountingBomCard() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const step2DetailMode = useCalculatorStore((s) => s.step2DetailMode);
  const { mounting } = calculationResult;
  const [inspectedItem, setInspectedItem] = useState<MountingItem | null>(null);

  const activeSpecs = inspectedItem
    ? ACCESSORY_TECHNICAL_DATA[inspectedItem.key] || ACCESSORY_TECHNICAL_DATA.roof_rail
    : null;

  return (
    <>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card dark:shadow-card-dark space-y-6 transition-colors duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-sm">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold block">
                BILL OF MATERIALS (BOM) &amp; MECHANICAL SPECS
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Roof Mounting Hardware ({mounting.panelCount} Modules Array)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 font-semibold">
              AL6005-T5 / SUS304
            </span>
            <span className="text-xs font-mono px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold">
              WIND LOAD: 60 M/S
            </span>
            <span className="text-xs font-mono px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold">
              EST. RACKING: {formatPeso(mounting.totalMountingCostPhp)}
            </span>
          </div>
        </div>

        {/* 6 High-Fidelity Accessory Cards Grid (Unconstrained, Zero Truncation) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mounting.items.map((item) => (
            <div
              key={item.key}
              onClick={() => setInspectedItem(item)}
              className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer space-y-3.5"
            >
              <div className="space-y-3">
                {/* Visual Preview Box & Primary Quantities */}
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex-shrink-0 flex items-center justify-center p-2 overflow-hidden shadow-subtle group-hover:scale-105 group-hover:border-amber-400/60 transition-transform">
                    <img
                      src={item.imagePath}
                      alt={item.name}
                      className="w-full h-full object-contain filter drop-shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = item.imagePath.replace('.webp', '.svg');
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold block">
                        {item.key.toUpperCase().replace('_', ' ')}
                      </span>
                      <button
                        type="button"
                        className="text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors p-1"
                        title="Click to inspect CAD specifications and engineering tolerances"
                        aria-label={`Inspect ${item.name} CAD specifications`}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
                      {item.name}
                    </h4>

                    <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1 flex items-baseline gap-1.5">
                      <span>{item.quantity}</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400 uppercase font-sans">
                        {item.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1.5 font-mono text-[11px] flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                        Unit: {formatPeso(item.unitPricePhp)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 font-bold">
                        Line: {formatPeso(item.totalPricePhp)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sizing Basis / Context Info Note (Included in both Min & Detailed) */}
                {item.calculationBasis && (
                  <div className="flex items-start gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                    <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="leading-tight">{item.calculationBasis}</span>
                  </div>
                )}

                {step2DetailMode === 'detailed' && (
                  <>
                    {/* Dimension & Material Quick Tag */}
                    {item.dimensions && (
                      <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold">
                          {item.dimensions.lengthMm} × {item.dimensions.widthMm} × {item.dimensions.heightMm} mm
                        </span>
                        {item.dimensions.torqueNm && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100/70 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium">
                            Torque: {item.dimensions.torqueNm}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Specification Box (No text truncation) */}
                    <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed shadow-subtle">
                      {item.specification}
                    </div>

                    {/* Engineering Explanation (Full unconstrained text) */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.explanation}
                    </p>
                  </>
                )}
              </div>

              {/* Card Footer: Standards & CAD Action (Detailed Only) */}
              {step2DetailMode === 'detailed' && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.standards?.slice(0, 2).map((std) => (
                        <span key={std} className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 font-medium">
                          {std}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectedItem(item);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-300 transition-colors shadow-sm"
                      title="Inspect CAD Dimensions"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>CAD</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={Boolean(inspectedItem && activeSpecs)}
        onClose={() => setInspectedItem(null)}
        labelledBy="cad-dialog-title"
        backdropClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        dialogClassName="relative w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        {inspectedItem && activeSpecs && (
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 shadow-sm flex items-center justify-center">
                  <img
                    src={inspectedItem.imagePath}
                    alt={inspectedItem.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = inspectedItem.imagePath.replace('.webp', '.svg');
                    }}
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold block">
                    ENGINEERING CAD BLUEPRINT &amp; DIMENSIONAL SPECS
                  </span>
                  <h3 id="cad-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
                    {inspectedItem.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setInspectedItem(null)}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close"
                aria-label="Close CAD Inspection dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-700 dark:text-slate-300">
              {/* Interactive CAD Blueprint Drawing Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-amber-500" />
                    Dimensional CAD Schematic Blueprint
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Units: Millimeters (mm)
                  </span>
                </div>
                
                {/* Embedded CAD Dimension Schematic */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                  <CadDimensionDrawing itemKey={inspectedItem.key} />
                </div>
              </div>

              {/* Labeled Millimeter Dimensions Metrics Grid */}
              {inspectedItem.dimensions && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    Measured Millimeter Dimensions
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase block">Length</span>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                        {inspectedItem.dimensions.lengthMm} mm
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase block">Width / Flange</span>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                        {inspectedItem.dimensions.widthMm} mm
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase block">Height / Depth</span>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                        {inspectedItem.dimensions.heightMm} mm
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase block">Wall Thickness</span>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                        {inspectedItem.dimensions.thicknessMm} mm
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantities & Formula Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
                <div>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase font-bold block">
                    REQUIRED QUANTITY
                  </span>
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {inspectedItem.quantity}{' '}
                    <span className="text-xs font-normal text-slate-500 uppercase">{inspectedItem.unit}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase font-bold block">
                    ESTIMATED COST (PHP)
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white block mt-1">
                    {formatPeso(inspectedItem.unitPricePhp)} <span className="text-xs font-normal text-slate-500">/ {inspectedItem.unit}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 block mt-0.5">
                    Line: {formatPeso(inspectedItem.totalPricePhp)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase font-bold block">
                    SYSTEM ARRAY ALLOCATION
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white block mt-1">
                    {mounting.panelCount} Solar Modules Total
                  </span>
                </div>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Engineering Specifications &amp; Standards
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Dimensions &amp; Profile</span>
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {activeSpecs.dimensions}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Alloy &amp; Composition</span>
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {inspectedItem.material ?? activeSpecs.material}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Fastener Hardware</span>
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {inspectedItem.dimensions?.fastenerSpec ?? activeSpecs.hardware}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Tightening Torque</span>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                      {inspectedItem.dimensions?.torqueNm ?? activeSpecs.torque}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Wind / Snow Load Capacity</span>
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {activeSpecs.loadRating}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Corrosion Protection</span>
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {inspectedItem.finish ?? activeSpecs.corrosion}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sizing Logic & Compliance Standards */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Engineering Sizing Basis &amp; Structural Codes</span>
                </div>
                <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 leading-relaxed">
                  {inspectedItem.calculationBasis}
                </p>
                
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">Certified Standards:</span>
                  {(inspectedItem.standards ?? [activeSpecs.standard]).map((std) => (
                    <span key={std} className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                      {std}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex justify-end">
              <button
                onClick={() => setInspectedItem(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-white transition-colors shadow-subtle"
              >
                Close CAD Inspection
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
