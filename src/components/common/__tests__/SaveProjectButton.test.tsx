import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SaveProjectButton } from '../SaveProjectButton';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { createMockUser, mountIntoDom } from '@/test/domTestUtils';

describe('SaveProjectButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCalculatorStore.getState().clearActiveProject();
    useCalculatorStore.getState().setActiveView('tool');
  });

  it('renders Save Project button when logged out or without active project', () => {
    const html = renderToStaticMarkup(createElement(SaveProjectButton, { authUser: null }));
    expect(html).toContain('Save Project');
  });

  it('renders Saved label when an activeProjectId is loaded', () => {
    useCalculatorStore.getState().setActiveProjectId('proj_abc123', 'Test Site');
    const html = renderToStaticMarkup(
      createElement(SaveProjectButton, { authUser: createMockUser() })
    );
    expect(html).toContain('Saved');
    expect(html).not.toContain('Save Project</span>');
  });

  it('opens auth modal for guest users and navigates to register on click', () => {
    const mounted = mountIntoDom(createElement(SaveProjectButton, { authUser: null }));
    try {
      const trigger = mounted.container.querySelector('button');
      expect(trigger).not.toBeNull();

      act(() => {
        trigger?.click();
      });

      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.textContent).toContain('LOGIN REQUIRED');
      expect(dialog?.textContent).toContain('Save Solar Projects');
      expect(dialog?.textContent).toContain('Log In to Account');
      expect(dialog?.textContent).toContain('Register New Account');

      const regBtn = Array.from(dialog?.querySelectorAll('button') || []).find((b) =>
        b.textContent?.includes('Register New Account')
      );
      expect(regBtn).toBeDefined();

      act(() => {
        regBtn?.click();
      });
      expect(useCalculatorStore.getState().activeView).toBe('register');
    } finally {
      mounted.unmount();
    }
  });
});
