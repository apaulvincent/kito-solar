import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useAuthStore } from '@/store/useAuthStore';
import { mountIntoDom } from '@/test/domTestUtils';
import { createElement } from 'react';

function TestShortcutConsumer() {
  const { isOpen, open, close, shortcuts } = useKeyboardShortcuts();
  return createElement(
    'div',
    null,
    createElement('span', { 'data-testid': 'is-open' }, isOpen ? 'open' : 'closed'),
    createElement('span', { 'data-testid': 'shortcut-count' }, shortcuts.length),
    createElement('button', { onClick: open, 'data-testid': 'open-btn' }, 'Open'),
    createElement('button', { onClick: close, 'data-testid': 'close-btn' }, 'Close')
  );
}

describe('useKeyboardShortcuts Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, isLoading: false, error: null });
    useCalculatorStore.getState().setActiveView('home');
  });

  it('initializes with modal closed and exposes defined shortcuts', () => {
    const mounted = mountIntoDom(createElement(TestShortcutConsumer));
    try {
      const statusEl = mounted.container.querySelector('[data-testid="is-open"]');
      const countEl = mounted.container.querySelector('[data-testid="shortcut-count"]');

      expect(statusEl?.textContent).toBe('closed');
      expect(Number(countEl?.textContent)).toBeGreaterThanOrEqual(10);
    } finally {
      mounted.unmount();
    }
  });

  it('toggles shortcuts modal when pressing ? key', () => {
    const mounted = mountIntoDom(createElement(TestShortcutConsumer));
    try {
      expect(mounted.container.querySelector('[data-testid="is-open"]')?.textContent).toBe('closed');

      // Dispatch '?' keydown on window
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
      });
      expect(mounted.container.querySelector('[data-testid="is-open"]')?.textContent).toBe('open');

      // Pressing '?' again toggles it off
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
      });
      expect(mounted.container.querySelector('[data-testid="is-open"]')?.textContent).toBe('closed');
    } finally {
      mounted.unmount();
    }
  });

  it('navigates to Solar Tool when Alt + 1 is pressed', () => {
    const mounted = mountIntoDom(createElement(TestShortcutConsumer));
    try {
      expect(useCalculatorStore.getState().activeView).toBe('home');

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: '1', altKey: true, bubbles: true })
        );
      });

      expect(useCalculatorStore.getState().activeView).toBe('tool');
    } finally {
      mounted.unmount();
    }
  });

  it('navigates to Load Calculator when Alt + 2 is pressed', () => {
    const mounted = mountIntoDom(createElement(TestShortcutConsumer));
    try {
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: '2', altKey: true, bubbles: true })
        );
      });

      expect(useCalculatorStore.getState().activeView).toBe('load-calculator');
    } finally {
      mounted.unmount();
    }
  });

  it('redirects to login when unauthenticated user triggers protected route Alt + 3 (Roof Mapper)', () => {
    const mounted = mountIntoDom(createElement(TestShortcutConsumer));
    try {
      expect(useAuthStore.getState().user).toBeNull();

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: '3', altKey: true, bubbles: true })
        );
      });

      expect(useCalculatorStore.getState().activeView).toBe('login');
    } finally {
      mounted.unmount();
    }
  });

  it('toggles theme when Alt + T is pressed', () => {
    const mounted = mountIntoDom(createElement(TestShortcutConsumer));
    try {
      const initialTheme = useCalculatorStore.getState().theme;

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: 't', altKey: true, bubbles: true })
        );
      });

      expect(useCalculatorStore.getState().theme).not.toBe(initialTheme);
    } finally {
      mounted.unmount();
    }
  });

  it('closes open modal on Escape key', () => {
    const mounted = mountIntoDom(createElement(TestShortcutConsumer));
    try {
      // Open modal first
      act(() => {
        mounted.container.querySelector<HTMLButtonElement>('[data-testid="open-btn"]')?.click();
      });
      expect(mounted.container.querySelector('[data-testid="is-open"]')?.textContent).toBe('open');

      // Press Escape
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
      expect(mounted.container.querySelector('[data-testid="is-open"]')?.textContent).toBe('closed');
    } finally {
      mounted.unmount();
    }
  });

  it('suppresses hotkey triggers when user is typing in an input element', () => {
    const mounted = mountIntoDom(createElement(TestShortcutConsumer));
    try {
      const inputEl = document.createElement('input');
      document.body.appendChild(inputEl);
      inputEl.focus();

      expect(useCalculatorStore.getState().activeView).toBe('home');

      // Dispatch '?' from the input element
      act(() => {
        inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
      });
      // Modal should NOT open
      expect(mounted.container.querySelector('[data-testid="is-open"]')?.textContent).toBe('closed');

      inputEl.remove();
    } finally {
      mounted.unmount();
    }
  });
});
