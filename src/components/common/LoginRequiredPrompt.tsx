import { Lock, LogIn, UserPlus, X } from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';

interface LoginRequiredPromptProps {
  title: string;
  description: string;
  titleId?: string;
  onClose?: () => void;
  registerLabel?: string;
  guestActionLabel?: string;
  showEyebrow?: boolean;
}

export function LoginRequiredPrompt({
  title,
  description,
  titleId,
  onClose,
  registerLabel = 'Register New Account',
  guestActionLabel,
  showEyebrow = true,
}: LoginRequiredPromptProps) {
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  const navigate = (view: 'login' | 'register' | 'tool') => {
    onClose?.();
    setActiveView(view);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-xs flex-shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            {showEyebrow && (
              <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold block">
                LOGIN REQUIRED
              </span>
            )}
            <h3
              id={titleId}
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight"
            >
              {title}
            </h3>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close modal"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>

      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => navigate('login')}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
        >
          <LogIn className="w-4 h-4 text-amber-400" />
          <span>Log In to Account</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('register')}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>{registerLabel}</span>
        </button>
      </div>

      {guestActionLabel && (
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => navigate('tool')}
            className="text-xs font-semibold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
          >
            {guestActionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
