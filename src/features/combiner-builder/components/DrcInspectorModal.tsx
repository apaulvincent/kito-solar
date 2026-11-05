// src/features/combiner-builder/components/DrcInspectorModal.tsx
import { useEffect, useMemo } from 'react';
import { X, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';
import { evaluateCombinerWiringDRC } from '../utils/combinerDrcEngine';

export function DrcInspectorModal() {
  const isDrcModalOpen = useCombinerBoxStore((s) => s.isDrcModalOpen);
  const setIsDrcModalOpen = useCombinerBoxStore((s) => s.setIsDrcModalOpen);
  const components = useCombinerBoxStore((s) => s.components);
  const wires = useCombinerBoxStore((s) => s.wires);

  const drcResult = useMemo(() => {
    return evaluateCombinerWiringDRC(components, wires);
  }, [components, wires]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrcModalOpen) {
        setIsDrcModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrcModalOpen, setIsDrcModalOpen]);

  if (!isDrcModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${
                drcResult.errorCount > 0
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : drcResult.warningCount > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {drcResult.errorCount > 0 ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Design Rule Checker (DRC) Inspector
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Automated electrical safety, ampacity & ATS logic validation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDrcModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close inspector (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Summary Banner */}
        <div
          className={`px-5 py-3 border-b text-xs flex items-center justify-between ${
            drcResult.errorCount > 0
              ? 'bg-rose-950/40 border-rose-900/50 text-rose-200'
              : drcResult.warningCount > 0
              ? 'bg-amber-950/40 border-amber-900/50 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {drcResult.errorCount > 0 ? (
              <span>⚠️ Critical faults prevent safe live energization.</span>
            ) : drcResult.warningCount > 0 ? (
              <span>⚡ Advisories detected. Review before closing enclosure.</span>
            ) : (
              <span>✓ All electrical parameters meet PEC and NEC compliance standards.</span>
            )}
          </div>
          <div className="font-mono text-[11px] space-x-3">
            <span>Errors: <strong className="text-rose-400">{drcResult.errorCount}</strong></span>
            <span>Warnings: <strong className="text-amber-400">{drcResult.warningCount}</strong></span>
            <span>Passes: <strong className="text-emerald-400">{drcResult.passCount}</strong></span>
          </div>
        </div>

        {/* Diagnostics Checklist */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {drcResult.diagnostics.map((diag) => (
            <div
              key={diag.id}
              className={`p-4 rounded-xl border flex items-start gap-3.5 transition-colors ${
                diag.severity === 'error'
                  ? 'bg-rose-950/20 border-rose-900/60'
                  : diag.severity === 'warning'
                  ? 'bg-amber-950/20 border-amber-900/60'
                  : 'bg-slate-950/40 border-slate-800'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {diag.severity === 'error' ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                ) : diag.severity === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`text-xs font-bold ${
                      diag.severity === 'error'
                        ? 'text-rose-300'
                        : diag.severity === 'warning'
                        ? 'text-amber-300'
                        : 'text-emerald-300'
                    }`}
                  >
                    {diag.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      diag.severity === 'error'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : diag.severity === 'warning'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {diag.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {diag.description}
                </p>

                <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="text-slate-500">RULE CODE:</span>
                  <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">
                    {diag.code}
                  </code>
                </div>
              </div>
            </div>
          ))}

          {drcResult.diagnostics.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-xs font-mono">
              Place components and connect wires to begin automated verification.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            Reference Standards: PEC 2017 Art 6.90 • NEC Art 705 • UL 1449
          </span>
          <button
            type="button"
            onClick={() => setIsDrcModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
