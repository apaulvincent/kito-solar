// src/components/common/SaveProjectButton.tsx
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Bookmark, Lock, X, LogIn, UserPlus } from 'lucide-react';
import { SaveProjectModal } from './SaveProjectModal';

interface SaveProjectButtonProps {
  className?: string;
  variant?: 'primary' | 'compact' | 'secondary';
  authUser?: any;
}

export function SaveProjectButton({
  className = '',
  variant = 'compact',
  authUser,
}: SaveProjectButtonProps) {
  const storeUser = useAuthStore((s) => s.user);
  const user = authUser !== undefined ? authUser : storeUser;
  const isLoggedIn = Boolean(user);

  const setActiveView = useCalculatorStore((s) => s.setActiveView);
  const activeProjectId = useCalculatorStore((s) => s.activeProjectId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAuthModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen]);

  const handleClick = () => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const buttonStyle =
    variant === 'compact'
      ? 'px-3 py-1.5 text-xs'
      : variant === 'secondary'
      ? 'px-3.5 py-2 text-xs'
      : 'px-4 py-2 text-xs font-bold';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={activeProjectId ? 'Update or save project' : 'Save configuration to your account'}
        className={`inline-flex items-center gap-1.5 rounded-xl font-mono font-semibold transition-all shadow-xs cursor-pointer active:scale-95 ${
          activeProjectId
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700/80'
        } ${buttonStyle} ${className}`}
      >
        <Bookmark className={`w-3.5 h-3.5 ${activeProjectId ? 'fill-current text-amber-500' : 'text-amber-500'}`} />
        <span>{activeProjectId ? 'Saved' : 'Save Project'}</span>
      </button>

      {/* Save Project Modal */}
      <SaveProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Guest Login Requirement Modal */}
      {isAuthModalOpen && (
        <div
          onClick={() => setIsAuthModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-auth-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs flex-shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold block">
                    LOGIN REQUIRED
                  </span>
                  <h3 id="save-auth-modal-title" className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Save Solar Projects
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Create an account or sign in to save up to 20 solar configurations to your account. You can reopen and edit them on any device.
            </p>

            {/* Actions */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setActiveView('login');
                }}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>Log In to Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setActiveView('register');
                }}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register New Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
