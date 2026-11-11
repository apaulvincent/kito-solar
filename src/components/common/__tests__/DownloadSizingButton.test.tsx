import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DownloadSizingButton } from '../DownloadSizingButton';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { createMockUser, mountIntoDom } from '@/test/domTestUtils';

describe('DownloadSizingButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCalculatorStore.getState().setActiveView('tool');
  });

  it('renders enabled button with no tooltip even when user is not logged in', () => {
    const html = renderToStaticMarkup(createElement(DownloadSizingButton, { authUser: null }));
    expect(html).toContain('Download Sizing');
    expect(html).not.toContain('disabled=""');
    expect(html).not.toContain('cursor-not-allowed');
    expect(html).toContain('cursor-pointer');
    expect(html).not.toContain('role="tooltip"');
  });

  it('renders enabled button when user is logged in', () => {
    const html = renderToStaticMarkup(
      createElement(DownloadSizingButton, { authUser: createMockUser() })
    );
    expect(html).toContain('Download Sizing');
    expect(html).not.toContain('disabled=""');
    expect(html).toContain('bg-emerald-600');
  });

  it('opens auth modal on click when logged out and navigates to login or closes on Escape', () => {
    const mounted = mountIntoDom(createElement(DownloadSizingButton, { authUser: null }));
    try {
      const trigger = mounted.container.querySelector('button');
      expect(trigger).not.toBeNull();

      act(() => {
        trigger?.click();
      });

      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.textContent).toContain('Account Required');
      expect(dialog?.textContent).toContain('Log In to Account');
      expect(dialog?.textContent).toContain('Register New Account');

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
      expect(document.body.querySelector('[role="dialog"]')).toBeNull();

      act(() => {
        trigger?.click();
      });
      const loginBtn = Array.from(document.body.querySelectorAll('[role="dialog"] button')).find((b) =>
        b.textContent?.includes('Log In to Account')
      ) as HTMLButtonElement | undefined;
      expect(loginBtn).toBeDefined();

      act(() => {
        loginBtn?.click();
      });
      expect(useCalculatorStore.getState().activeView).toBe('login');
      expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    } finally {
      mounted.unmount();
    }
  });
});
