import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Header } from '../Header';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useAuthStore } from '@/store/useAuthStore';
import { mountIntoDom } from '@/test/domTestUtils';

describe('Header Responsive Navigation & Network Status Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, isLoading: false, error: null });
    useCalculatorStore.getState().setActiveView('home');
  });

  it('renders desktop navigation in static markup with primary tabs in sequence', () => {
    const html = renderToStaticMarkup(createElement(Header));
    const homeIdx = html.indexOf('<span>Home</span>');
    const toolIdx = html.indexOf('<span>Solar Tool</span>');
    const loadCalcIdx = html.indexOf('<span>Load Calculator</span>');

    expect(homeIdx).toBeGreaterThan(-1);
    expect(toolIdx).toBeGreaterThan(homeIdx);
    expect(loadCalcIdx).toBeGreaterThan(toolIdx);
    expect(html).toContain('aria-label="Open navigation menu"');
  });

  it('toggles mobile navigation drawer on mobile hamburger button click', () => {
    const mounted = mountIntoDom(createElement(Header));
    try {
      const toggleBtn = mounted.container.querySelector('button[aria-label="Open navigation menu"]');
      expect(toggleBtn).not.toBeNull();
      expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');

      // Click to open
      act(() => {
        toggleBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(toggleBtn?.getAttribute('aria-label')).toBe('Close navigation menu');
      expect(toggleBtn?.getAttribute('aria-expanded')).toBe('true');

      const mobileNav = mounted.container.querySelector('nav[aria-label="Mobile navigation"]');
      expect(mobileNav).not.toBeNull();
      expect(mobileNav?.textContent).toContain('Solar Tool');
      expect(mobileNav?.textContent).toContain('Load Calculator');

      // Click a navigation item to navigate and close mobile drawer
      const toolButton = Array.from(mobileNav?.querySelectorAll('button') || []).find(
        (b) => b.textContent?.includes('Solar Tool')
      );
      expect(toolButton).toBeDefined();

      act(() => {
        toolButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(useCalculatorStore.getState().activeView).toBe('tool');
      expect(mounted.container.querySelector('nav[aria-label="Mobile navigation"]')).toBeNull();
    } finally {
      mounted.unmount();
    }
  });

  it('displays offline indicator when network goes offline', () => {
    const mounted = mountIntoDom(createElement(Header));
    try {
      expect(mounted.container.textContent).not.toContain('Offline');

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(mounted.container.textContent).toContain('Offline');

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(mounted.container.textContent).not.toContain('Offline');
    } finally {
      mounted.unmount();
    }
  });
});
