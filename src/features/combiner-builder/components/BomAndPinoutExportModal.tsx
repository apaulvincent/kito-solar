// src/features/combiner-builder/components/BomAndPinoutExportModal.tsx
import { useEffect, useMemo, useState } from 'react';
import { X, FileDown, Layers, CheckCircle2, Cable } from 'lucide-react';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';
import { generateCombinerSchedulePdf } from '../utils/combinerPdfExporter';
import { calculateWireCutLengthMeters } from '../utils/wireRouting3D';

export function BomAndPinoutExportModal() {
  const isExportModalOpen = useCombinerBoxStore((s) => s.isExportModalOpen);
  const setIsExportModalOpen = useCombinerBoxStore((s) => s.setIsExportModalOpen);
  const components = useCombinerBoxStore((s) => s.components);
  const wires = useCombinerBoxStore((s) => s.wires);
  const activeTemplateId = useCombinerBoxStore((s) => s.activeTemplateId);

  const [activeTab, setActiveTab] = useState<'bom' | 'cutlist' | 'schedule'>('bom');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExportModalOpen) {
        setIsExportModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExportModalOpen, setIsExportModalOpen]);

  // Aggregate BoM
  const bomItems = useMemo(() => {
    const map = new Map<
      string,
      { name: string; brand: string; rating: string; qty: number; unitPrice: number }
    >();

    components.forEach((c) => {
      const key = `${c.name}_${c.ratedVoltage}_${c.ratedAmps}`;
      const existing = map.get(key);
      if (existing) {
        existing.qty += 1;
      } else {
        map.set(key, {
          name: c.name,
          brand: c.brand,
          rating: c.ratedAmps > 0 ? `${c.ratedVoltage} / ${c.ratedAmps}A` : c.ratedVoltage,
          qty: 1,
          unitPrice: c.pricePhp,
        });
      }
    });

    return Array.from(map.values());
  }, [components]);

  const totalCost = useMemo(() => {
    return components.reduce((sum, c) => sum + c.pricePhp, 0);
  }, [components]);

  // Aggregate Wire Cut-List
  const wireCutList = useMemo(() => {
    const map = new Map<number, number>();
    wires.forEach((w) => {
      const len = calculateWireCutLengthMeters(w.waypoints3D || []);
      map.set(w.gaugeMm2, (map.get(w.gaugeMm2) || 0) + len);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [wires]);

  const handleDownloadPdf = () => {
    try {
      setIsExporting(true);
      const doc = generateCombinerSchedulePdf({
        components,
        wires,
        projectName:
          activeTemplateId === 'template_reference_diagram'
            ? 'Reference SLD 100A ATS & PV Combiner Box'
            : activeTemplateId === 'template_mt_solarcell'
            ? 'MT SolarCell Solenoid ATS & Smart Meter Box'
            : 'JEsolar Hybrid 2-String + ATS Combiner Box',
      });
      doc.save('KitoSolar_Combiner_Wiring_Schedule.pdf');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isExportModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Bill of Materials & Pin-to-Pin Wiring Schedule
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Physical installation cut-list, ferrules & equipment breakdown
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('bom')}
            className={`pb-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'bom'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Equipment BoM ({bomItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cutlist')}
            className={`pb-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'cutlist'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Cable className="w-3.5 h-3.5" />
            <span>Wire Cut-List ({wireCutList.length} Gauges)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`pb-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'schedule'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Terminal Schedule ({wires.length} Runs)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {/* Tab 1: BoM */}
          {activeTab === 'bom' && (
            <div className="space-y-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Brand</th>
                    <th className="pb-2">Rating</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {bomItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20">
                      <td className="py-2.5 text-white font-medium">{item.name}</td>
                      <td className="py-2.5 text-slate-400 font-mono">{item.brand}</td>
                      <td className="py-2.5 text-amber-400 font-mono">{item.rating}</td>
                      <td className="py-2.5 text-center font-mono font-bold text-white">{item.qty}</td>
                      <td className="py-2.5 text-right font-mono text-slate-300">
                        ₱{item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                        ₱{(item.qty * item.unitPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                <span className="text-slate-400">Total Enclosure Bill of Materials:</span>
                <span className="text-base font-bold text-emerald-400">
                  ₱{totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Tab 2: Wire Cut-List */}
          {activeTab === 'cutlist' && (
            <div className="space-y-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="pb-2">Conductor Size</th>
                    <th className="pb-2">Physical Runs</th>
                    <th className="pb-2 text-right">Exact Length</th>
                    <th className="pb-2 text-right">Cut (+10% Dressing Slack)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {wireCutList.map(([gauge, len]) => (
                    <tr key={gauge} className="hover:bg-slate-800/20">
                      <td className="py-2.5 text-amber-400 font-mono font-bold">{gauge} mm²</td>
                      <td className="py-2.5 text-slate-400">
                        {wires.filter((w) => w.gaugeMm2 === gauge).length} wires
                      </td>
                      <td className="py-2.5 text-right font-mono text-white">{len.toFixed(2)} m</td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                        {Math.ceil(len * 1.1)} meters
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-slate-400 text-[11px] leading-relaxed">
                💡 <strong className="text-slate-200">Installer Workbench Tip:</strong> Each wire end requires a crimped bootlace ferrule to protect stranded copper strands inside screw clamp terminals. Use insulated single ferrules for standalone runs, and twin entry ferrules for jumper loop origins.
              </div>
            </div>
          )}

          {/* Tab 3: Step-by-Step Terminal Schedule */}
          {activeTab === 'schedule' && (
            <div className="space-y-2">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-2">Wire #</th>
                    <th className="pb-2">From Port</th>
                    <th className="pb-2">To Port</th>
                    <th className="pb-2">Gauge & Color</th>
                    <th className="pb-2">Ferrule</th>
                    <th className="pb-2 text-right">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {wires.map((w, idx) => {
                    const lenM = calculateWireCutLengthMeters(w.waypoints3D || []);
                    return (
                      <tr key={w.id} className="hover:bg-slate-800/20">
                        <td className="py-2 text-amber-400 font-bold">W-{String(idx + 1).padStart(2, '0')}</td>
                        <td className="py-2 text-white truncate max-w-[140px]">{w.fromPortId}</td>
                        <td className="py-2 text-white truncate max-w-[140px]">{w.toPortId}</td>
                        <td className="py-2 text-slate-300">
                          {w.gaugeMm2}mm² ({w.wireColor})
                        </td>
                        <td className="py-2 uppercase text-sky-400">{w.ferruleColor}</td>
                        <td className="py-2 text-right text-emerald-400 font-bold">
                          {Math.round(lenM * 100)} cm
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            Ready for physical panel assembly & inspection
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Generating PDF...' : 'Download Wiring Guide (PDF)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
