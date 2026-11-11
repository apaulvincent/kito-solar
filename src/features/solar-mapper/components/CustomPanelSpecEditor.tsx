import React, { useEffect, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { PANEL_SPECS, RoofPolygonSection } from '../types/solarMapper';

interface CustomPanelSpecEditorProps {
  activeSection: RoofPolygonSection;
  roofSectionsCount: number;
  defaultPanelWattage: 550 | 580 | 600;
  onSetPanelWattage: (wattage: 550 | 580 | 600) => void;
  onUpdateSection: (id: string, updates: Partial<RoofPolygonSection>) => void;
  onApplySpecsToAll: (specs: {
    customPanelWidthM: number;
    customPanelLengthM: number;
    customPanelWattage: number;
  }) => void;
}

export const CustomPanelSpecEditor: React.FC<CustomPanelSpecEditorProps> = ({
  activeSection,
  roofSectionsCount,
  defaultPanelWattage,
  onSetPanelWattage,
  onUpdateSection,
  onApplySpecsToAll,
}) => {
  const activeSecSpec = PANEL_SPECS[activeSection.panelWattage] ?? PANEL_SPECS[580];
  const currentWidthM = activeSection.customPanelWidthM ?? activeSecSpec.widthM;
  const currentLengthM = activeSection.customPanelLengthM ?? activeSecSpec.lengthM;
  const currentWattage =
    activeSection.customPanelWattage ?? activeSection.panelWattage ?? defaultPanelWattage ?? 580;

  const isCustom = Boolean(
    activeSection.customPanelWidthM !== undefined ||
      activeSection.customPanelLengthM !== undefined ||
      activeSection.customPanelWattage !== undefined ||
      ![550, 580, 600].includes(currentWattage)
  );

  const [lengthInput, setLengthInput] = useState<string>(currentLengthM.toString());
  const [widthInput, setWidthInput] = useState<string>(currentWidthM.toString());
  const [wattageInput, setWattageInput] = useState<string>(currentWattage.toString());

  useEffect(() => {
    setLengthInput(currentLengthM.toString());
    setWidthInput(currentWidthM.toString());
    setWattageInput(currentWattage.toString());
  }, [
    activeSection.id,
    activeSection.customPanelLengthM,
    activeSection.customPanelWidthM,
    activeSection.customPanelWattage,
    activeSection.panelWattage,
    currentLengthM,
    currentWidthM,
    currentWattage,
  ]);

  const handleLengthChange = (valStr: string) => {
    setLengthInput(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0.3 && val <= 5.0) {
      onUpdateSection(activeSection.id, {
        customPanelLengthM: Math.round(val * 1000) / 1000,
        customPanelWidthM: currentWidthM,
        customPanelWattage: currentWattage,
      });
    }
  };

  const handleWidthChange = (valStr: string) => {
    setWidthInput(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0.2 && val <= 3.5) {
      onUpdateSection(activeSection.id, {
        customPanelWidthM: Math.round(val * 1000) / 1000,
        customPanelLengthM: currentLengthM,
        customPanelWattage: currentWattage,
      });
    }
  };

  const handleWattageChange = (valStr: string) => {
    setWattageInput(valStr);
    const val = parseInt(valStr, 10);
    if (!isNaN(val) && val >= 50 && val <= 1500) {
      onUpdateSection(activeSection.id, {
        customPanelWattage: val,
        customPanelWidthM: currentWidthM,
        customPanelLengthM: currentLengthM,
      });
    }
  };

  const handleSelectPreset = (w: 550 | 580 | 600) => {
    onSetPanelWattage(w);
    const spec = PANEL_SPECS[w];
    onUpdateSection(activeSection.id, {
      panelWattage: w,
      customPanelWidthM: undefined,
      customPanelLengthM: undefined,
      customPanelWattage: undefined,
    });
    setLengthInput(spec.lengthM.toString());
    setWidthInput(spec.widthM.toString());
    setWattageInput(w.toString());
  };

  const dimensionInputs = [
    {
      label: 'Length',
      value: lengthInput,
      onChange: handleLengthChange,
      step: '0.01',
      min: '0.3',
      max: '5.0',
      unit: 'm',
      sublabel: `${Math.round(currentLengthM * 1000)} mm`,
    },
    {
      label: 'Width',
      value: widthInput,
      onChange: handleWidthChange,
      step: '0.01',
      min: '0.2',
      max: '3.5',
      unit: 'm',
      sublabel: `${Math.round(currentWidthM * 1000)} mm`,
    },
    {
      label: 'Power',
      value: wattageInput,
      onChange: handleWattageChange,
      step: '5',
      min: '50',
      max: '1500',
      unit: 'W',
      sublabel: `${(currentWattage / 1000).toFixed(2)} kWp`,
    },
  ];

  return (
    <div className="rounded-xl bg-white dark:bg-[#0B111E] border border-slate-200/80 dark:border-white/10 p-3.5 space-y-3 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            PV Module Specifications
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {([550, 580, 600] as const).map((w) => {
            const isPresetActive = !isCustom && currentWattage === w;
            return (
              <button
                key={w}
                type="button"
                onClick={() => handleSelectPreset(w)}
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                  isPresetActive
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {w}W
              </button>
            );
          })}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all ${
              isCustom
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-white/5 text-slate-400 opacity-60'
            }`}
          >
            Custom
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {dimensionInputs.map((field) => (
          <div
            key={field.label}
            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 space-y-1"
          >
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {field.label}
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step={field.step}
                min={field.min}
                max={field.max}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full font-mono text-sm font-bold text-slate-900 dark:text-white bg-transparent border-none p-0 focus:outline-hidden"
              />
              <span className="text-xs font-mono text-slate-400 shrink-0">{field.unit}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">{field.sublabel}</div>
          </div>
        ))}

        <div className="p-2.5 rounded-xl bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border border-amber-500/20 space-y-1">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Footprint
          </span>
          <div className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
            {(currentLengthM * currentWidthM).toFixed(2)}{' '}
            <span className="text-xs font-normal">m²</span>
          </div>
          <div className="text-[10px] font-mono text-amber-600/80 dark:text-amber-400/80">
            {(currentLengthM / (currentWidthM || 1)).toFixed(2)}:1 ratio
          </div>
        </div>
      </div>

      {roofSectionsCount > 1 && (
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400">
          <span>{(currentLengthM * currentWidthM).toFixed(3)} m² per panel</span>
          <button
            type="button"
            onClick={() =>
              onApplySpecsToAll({
                customPanelWidthM: currentWidthM,
                customPanelLengthM: currentLengthM,
                customPanelWattage: currentWattage,
              })
            }
            className="text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
          >
            Apply to all {roofSectionsCount} faces
          </button>
        </div>
      )}
    </div>
  );
};
