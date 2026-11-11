import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Bookmark } from 'lucide-react';
import { SaveProjectModal } from './SaveProjectModal';
import { Modal } from './Modal';
import { LoginRequiredPrompt } from './LoginRequiredPrompt';

interface SaveProjectButtonProps {
  className?: string;
  variant?: 'primary' | 'compact' | 'secondary';
  authUser?: User | null;
}

export function SaveProjectButton({
  className = '',
  variant = 'compact',
  authUser,
}: SaveProjectButtonProps) {
  const storeUser = useAuthStore((s) => s.user);
  const user = authUser !== undefined ? authUser : storeUser;
  const isLoggedIn = Boolean(user);

  const activeProjectId = useCalculatorStore((s) => s.activeProjectId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

      <SaveProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        labelledBy="save-auth-modal-title"
        backdropClassName="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        dialogClassName="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-7 animate-in zoom-in-95 duration-200"
      >
        <LoginRequiredPrompt
          titleId="save-auth-modal-title"
          title="Save Solar Projects"
          description="Create an account or sign in to save up to 20 solar configurations to your account. You can reopen and edit them on any device."
          onClose={() => setIsAuthModalOpen(false)}
        />
      </Modal>
    </>
  );
}
