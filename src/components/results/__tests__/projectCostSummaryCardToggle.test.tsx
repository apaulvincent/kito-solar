import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProjectCostSummaryCard } from '../ProjectCostSummaryCard';
import { installMockLocalStorage } from '@/test/mockLocalStorage';
import { mountIntoDom } from '@/test/domTestUtils';

describe('ProjectCostSummaryCard ROI & Subtotals Toggle Suite', () => {
  let storageHandle: ReturnType<typeof installMockLocalStorage>;

  beforeAll(() => {
    storageHandle = installMockLocalStorage();
  });

  afterAll(() => {
    storageHandle.restore();
  });

  beforeEach(() => {
    storageHandle.reset();
  });

  it('keeps Estimated System Total Investment permanently visible while hiding ROI and Subtotals by default', () => {
    const markup = renderToStaticMarkup(createElement(ProjectCostSummaryCard));

    expect(markup).toContain('FINANCIALS &amp; BILL OF MATERIALS (BOM)');
    expect(markup).toContain('Estimated Project Investment');
    expect(markup).toContain('ESTIMATED SYSTEM TOTAL INVESTMENT');
    expect(markup).toContain('View Pricing');
    expect(markup).toContain('>ROI<');

    expect(markup).not.toContain('FINANCIAL SAVINGS &amp; ROI ANALYSIS');
    expect(markup).not.toContain('Major Equipment');
    expect(markup).not.toContain('Roof Racking Hardware');
    expect(markup).not.toContain('Switchgear &amp; Protection');
  });

  it('renders ROI and subtotals when localStorage indicates expanded', () => {
    localStorage.setItem('kito_show_financial_roi_details', 'true');
    const markup = renderToStaticMarkup(createElement(ProjectCostSummaryCard));

    expect(markup).toContain('ESTIMATED SYSTEM TOTAL INVESTMENT');
    expect(markup).toContain('>ROI<');
    expect(markup).toContain('View Pricing');

    expect(markup).toContain('FINANCIAL SAVINGS &amp; ROI ANALYSIS');
    expect(markup).toContain('Major Equipment');
    expect(markup).toContain('Roof Racking Hardware');
    expect(markup).toContain('Switchgear &amp; Protection');
  });

  it('toggles ROI expansion on click and persists state to localStorage', () => {
    const mounted = mountIntoDom(createElement(ProjectCostSummaryCard));
    try {
      const toggleBtn = mounted.container.querySelector<HTMLButtonElement>('button[aria-expanded]');
      expect(toggleBtn).not.toBeNull();
      expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');
      expect(mounted.container.textContent).not.toContain('FINANCIAL SAVINGS & ROI ANALYSIS');

      act(() => {
        toggleBtn?.click();
      });

      expect(toggleBtn?.getAttribute('aria-expanded')).toBe('true');
      expect(mounted.container.textContent).toContain('FINANCIAL SAVINGS & ROI ANALYSIS');
      expect(localStorage.getItem('kito_show_financial_roi_details')).toBe('true');
    } finally {
      mounted.unmount();
    }
  });
});
