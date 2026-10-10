// src/components/common/EngineeringDisclaimer.tsx
import { AlertTriangle } from 'lucide-react';

export function EngineeringDisclaimer() {
  return (
    <footer className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 text-xs text-slate-600 dark:text-slate-400 shadow-subtle space-y-2">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <strong className="text-slate-900 dark:text-slate-100 font-bold font-mono">Comprehensive Guide Disclaimer: </strong>
          This application serves strictly as an educational and engineering guide for building solar systems. Calculations, sizing tables, and 3D schematics are planning references based on user-configured component specifications. They do not constitute a guaranteed or certified installation. Final equipment selection, conductor sizing, protection, grounding, physical installation, and electrical code compliance must be inspected and certified by a qualified licensed electrical professional and applicable local authorities.
        </p>
      </div>
    </footer>
  );
}
