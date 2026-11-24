import { useEffect, useState, useCallback } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ActiveView } from '@/types/calculator';

export type ShortcutCategory = 'Navigation' | 'Studio' | 'System';

export interface ShortcutDefinition {
  id: string;
  keys: string[];
  label: string;
  category: ShortcutCategory;
  action: () => void;
  requiresAuth?: boolean;
}

export function useKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  const setActiveView = useCalculatorStore((s) => s.setActiveView);
  const toggleTheme = useCalculatorStore((s) => s.toggleTheme);
  const user = useAuthStore((s) => s.user);

  const navigateTo = useCallback(
    (view: ActiveView, requiresAuth = false) => {
      if (requiresAuth && !user) {
        setActiveView('login');
      } else {
        setActiveView(view);
      }
      setIsOpen(false);
    },
    [user, setActiveView]
  );

  const shortcuts: ShortcutDefinition[] = [
    {
      id: 'home',
      keys: ['Alt', 'H'],
      label: 'Home Dashboard',
      category: 'Navigation',
      action: () => navigateTo('home'),
    },
    {
      id: 'tool',
      keys: ['Alt', '1'],
      label: 'Solar Engineering Studio',
      category: 'Navigation',
      action: () => navigateTo('tool'),
    },
    {
      id: 'load-calculator',
      keys: ['Alt', '2'],
      label: 'Appliance Load Calculator',
      category: 'Navigation',
      action: () => navigateTo('load-calculator'),
    },
    {
      id: 'solar-mapper',
      keys: ['Alt', '3'],
      label: '3D Roof Mapper',
      category: 'Navigation',
      action: () => navigateTo('solar-mapper', true),
      requiresAuth: true,
    },
    {
      id: 'financial-roi',
      keys: ['Alt', '4'],
      label: 'Financial ROI Simulator',
      category: 'Navigation',
      action: () => navigateTo('financial-roi', true),
      requiresAuth: true,
    },
    {
      id: 'yield-simulator',
      keys: ['Alt', '5'],
      label: 'Solar Yield Monitor',
      category: 'Navigation',
      action: () => navigateTo('yield-simulator', true),
      requiresAuth: true,
    },
    {
      id: 'projects',
      keys: ['Alt', '6'],
      label: 'Saved Projects',
      category: 'Navigation',
      action: () => navigateTo('projects'),
    },
    {
      id: 'contact',
      keys: ['Alt', 'C'],
      label: 'Contact & Support',
      category: 'Navigation',
      action: () => navigateTo('contact'),
    },
    {
      id: 'toggle-theme',
      keys: ['Alt', 'T'],
      label: 'Toggle Light / Dark Mode',
      category: 'Studio',
      action: () => toggleTheme(),
    },
    {
      id: 'shortcuts-help',
      keys: ['?'],
      label: 'Open Keyboard Shortcuts',
      category: 'System',
      action: () => setIsOpen((prev) => !prev),
    },
    {
      id: 'close-modal',
      keys: ['Esc'],
      label: 'Close Active Dialog or Drawer',
      category: 'System',
      action: () => setIsOpen(false),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      const isInput =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');

      if (e.key === 'Escape') {
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
        }
        return;
      }

      // Do not trigger hotkeys when typing in editable inputs
      if (isInput) return;

      // Handle '?' or Shift + '/' to toggle shortcuts modal
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // Handle Alt + Key combinations
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === '1') {
          e.preventDefault();
          navigateTo('tool');
        } else if (key === '2') {
          e.preventDefault();
          navigateTo('load-calculator');
        } else if (key === '3') {
          e.preventDefault();
          navigateTo('solar-mapper', true);
        } else if (key === '4') {
          e.preventDefault();
          navigateTo('financial-roi', true);
        } else if (key === '5') {
          e.preventDefault();
          navigateTo('yield-simulator', true);
        } else if (key === '6') {
          e.preventDefault();
          navigateTo('projects');
        } else if (key === 'h') {
          e.preventDefault();
          navigateTo('home');
        } else if (key === 'c') {
          e.preventDefault();
          navigateTo('contact');
        } else if (key === 't') {
          e.preventDefault();
          toggleTheme();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, navigateTo, toggleTheme]);

  return {
    isOpen,
    setIsOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
    shortcuts,
  };
}
