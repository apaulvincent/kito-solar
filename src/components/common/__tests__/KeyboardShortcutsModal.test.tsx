import { describe, it, expect, vi } from 'vitest';
import { createElement, act } from 'react';
import { KeyboardShortcutsModal } from '../KeyboardShortcutsModal';
import { ShortcutDefinition } from '@/hooks/useKeyboardShortcuts';
import { mountIntoDom } from '@/test/domTestUtils';

const mockShortcuts: ShortcutDefinition[] = [
  {
    id: 'tool',
    keys: ['Alt', '1'],
    label: 'Solar Engineering Studio',
    category: 'Navigation',
    action: vi.fn(),
  },
  {
    id: 'solar-mapper',
    keys: ['Alt', '3'],
    label: '3D Roof Mapper',
    category: 'Navigation',
    action: vi.fn(),
    requiresAuth: true,
  },
  {
    id: 'toggle-theme',
    keys: ['Alt', 'T'],
    label: 'Toggle Light / Dark Mode',
    category: 'Studio',
    action: vi.fn(),
  },
  {
    id: 'shortcuts-help',
    keys: ['?'],
    label: 'Open Keyboard Shortcuts',
    category: 'System',
    action: vi.fn(),
  },
];

describe('KeyboardShortcutsModal Suite', () => {
  it('does not render when isOpen is false', () => {
    const handleClose = vi.fn();
    const mounted = mountIntoDom(
      createElement(KeyboardShortcutsModal, {
        isOpen: false,
        onClose: handleClose,
        shortcuts: mockShortcuts,
      })
    );

    try {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeNull();
    } finally {
      mounted.unmount();
    }
  });

  it('renders modal dialog with categorized shortcuts when isOpen is true', () => {
    const handleClose = vi.fn();
    const mounted = mountIntoDom(
      createElement(KeyboardShortcutsModal, {
        isOpen: true,
        onClose: handleClose,
        shortcuts: mockShortcuts,
      })
    );

    try {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.textContent).toContain('Studio Keyboard Shortcuts');
      expect(dialog?.textContent).toContain('Navigation');
      expect(dialog?.textContent).toContain('Studio');
      expect(dialog?.textContent).toContain('System');
      expect(dialog?.textContent).toContain('Solar Engineering Studio');
      expect(dialog?.textContent).toContain('3D Roof Mapper');
      expect(dialog?.textContent).toContain('Auth');
    } finally {
      mounted.unmount();
    }
  });

  it('calls onClose when clicking the close button or Got it button', () => {
    const handleClose = vi.fn();
    const mounted = mountIntoDom(
      createElement(KeyboardShortcutsModal, {
        isOpen: true,
        onClose: handleClose,
        shortcuts: mockShortcuts,
      })
    );

    try {
      const closeBtn = document.querySelector('button[aria-label="Close shortcuts modal"]');
      expect(closeBtn).not.toBeNull();

      act(() => {
        closeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(handleClose).toHaveBeenCalledTimes(1);

      const gotItBtn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Got it'
      );
      expect(gotItBtn).not.toBeNull();

      act(() => {
        gotItBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(handleClose).toHaveBeenCalledTimes(2);
    } finally {
      mounted.unmount();
    }
  });

  it('strictly avoids em dashes in all rendered text', () => {
    const mounted = mountIntoDom(
      createElement(KeyboardShortcutsModal, {
        isOpen: true,
        onClose: vi.fn(),
        shortcuts: mockShortcuts,
      })
    );

    try {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog?.textContent).not.toContain('—');
    } finally {
      mounted.unmount();
    }
  });
});
