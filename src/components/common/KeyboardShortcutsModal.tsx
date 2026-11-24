import { Keyboard, X, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { ShortcutDefinition } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutDefinition[];
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
  shortcuts,
}: KeyboardShortcutsModalProps) {
  const categories: ShortcutDefinition['category'][] = ['Navigation', 'Studio', 'System'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      dialogClassName="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 shadow-xs">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-amber-700 dark:text-amber-400 font-bold block">
              WORKBENCH ACCELERATORS
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Studio Keyboard Shortcuts
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close shortcuts modal"
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Shortcuts List Grouped by Category */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {categories.map((category) => {
          const categoryShortcuts = shortcuts.filter((s) => s.category === category);
          if (categoryShortcuts.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                {category}
              </h3>

              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 divide-y divide-slate-200/60 dark:divide-slate-800/60 overflow-hidden">
                {categoryShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {shortcut.label}
                      </span>
                      {shortcut.requiresAuth && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Auth
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 font-mono">
                      {shortcut.keys.map((k, idx) => (
                        <span key={k} className="inline-flex items-center gap-1">
                          <kbd className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs">
                            {k}
                          </kbd>
                          {idx < shortcut.keys.length - 1 && (
                            <span className="text-slate-400 dark:text-slate-500 text-[10px]">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Press ? anywhere outside text fields to toggle</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-white shadow-xs transition-colors"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
}
