import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SpecAccordionProps {
  modelName: string;
  headerContent: ReactNode;
  accent?: 'amber' | 'emerald';
  children: ReactNode;
}

export function SpecAccordion({
  modelName,
  headerContent,
  accent = 'amber',
  children,
}: SpecAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const focusRingClass =
    accent === 'emerald'
      ? 'focus-visible:ring-emerald-500/40'
      : 'focus-visible:ring-amber-500/40';
  const chevronUpClass =
    accent === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-amber-600 dark:text-amber-400';

  return (
    <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Hide' : 'Show'} ${modelName} specifications`}
        className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${focusRingClass} group`}
      >
        <div className="flex items-center gap-2 min-w-0">{headerContent}</div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 hidden xs:inline">
            {isOpen ? 'Hide Specs' : 'View Specs'}
          </span>
          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            {isOpen ? (
              <ChevronUp className={`w-3.5 h-3.5 ${chevronUpClass}`} />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-slate-100 dark:border-white/5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
