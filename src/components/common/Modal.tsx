import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDismissable } from '@/hooks/useDismissable';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy?: string;
  backdropClassName?: string;
  dialogClassName?: string;
  lockScroll?: boolean;
  children: ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  labelledBy,
  backdropClassName = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150',
  dialogClassName = 'relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-150',
  lockScroll = false,
  children,
}: ModalProps) {
  useDismissable({
    isOpen,
    onClose,
    closeOnOutsideClick: false,
    closeOnEscape: true,
    lockScroll,
  });

  if (!isOpen) return null;

  const modalNode = (
    <div onClick={onClose} className={backdropClassName}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className={dialogClassName}
      >
        {children}
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalNode, document.body);
  }

  return modalNode;
}
