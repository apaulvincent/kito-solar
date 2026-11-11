import { RefObject, useEffect } from 'react';

interface UseDismissableOptions {
  isOpen: boolean;
  onClose: () => void;
  containerRef?: RefObject<HTMLElement | null>;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  lockScroll?: boolean;
}

/**
 * Wires outside-pointer dismissal, Escape key handling, and optional body scroll locking
 * while a dialog, drawer, or popover is open.
 */
export function useDismissable({
  isOpen,
  onClose,
  containerRef,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  lockScroll = false,
}: UseDismissableOptions) {
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!closeOnOutsideClick || !containerRef?.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    if (closeOnOutsideClick && containerRef) {
      document.addEventListener('pointerdown', handlePointerDown);
    }
    if (closeOnEscape) {
      window.addEventListener('keydown', handleKeyDown);
    }

    let previousOverflow: string | undefined;
    if (lockScroll && typeof document !== 'undefined') {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      if (closeOnOutsideClick && containerRef) {
        document.removeEventListener('pointerdown', handlePointerDown);
      }
      if (closeOnEscape) {
        window.removeEventListener('keydown', handleKeyDown);
      }
      if (lockScroll && typeof document !== 'undefined') {
        document.body.style.overflow = previousOverflow || 'unset';
      }
    };
  }, [isOpen, onClose, containerRef, closeOnOutsideClick, closeOnEscape, lockScroll]);
}
