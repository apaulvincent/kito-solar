// src/components/results/__tests__/projectCostSummaryCardToggle.test.tsx
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProjectCostSummaryCard } from '../ProjectCostSummaryCard';

describe('ProjectCostSummaryCard ROI & Subtotals Toggle Suite', () => {
  const storeMap: Record<string, string> = {};

  beforeAll(() => {
    const mockStorage = {
      getItem: (key: string) => storeMap[key] ?? null,
      setItem: (key: string, value: string) => {
        storeMap[key] = String(value);
      },
      removeItem: (key: string) => {
        delete storeMap[key];
      },
      clear: () => {
        for (const k of Object.keys(storeMap)) {
          delete storeMap[k];
        }
      },
      length: 0,
      key: () => null,
    };

    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).window = globalThis;
  });

  afterAll(() => {
    delete (globalThis as any).localStorage;
    delete (globalThis as any).window;
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps Estimated System Total Investment permanently visible while hiding ROI and Subtotals by default', () => {
    const markup = renderToStaticMarkup(createElement(ProjectCostSummaryCard));

    // Header and high-level investment total MUST remain visible
    expect(markup).toContain('FINANCIALS &amp; BILL OF MATERIALS (BOM)');
    expect(markup).toContain('Estimated Project Investment');
    expect(markup).toContain('ESTIMATED SYSTEM TOTAL INVESTMENT');
    expect(markup).toContain('View Itemized Pricing');
    expect(markup).toContain('Show ROI &amp; Subtotals');
    expect(markup).not.toContain('Hide ROI &amp; Subtotals');

    // Financial ROI and Discipline Subtotals MUST be hidden by default
    expect(markup).not.toContain('FINANCIAL SAVINGS &amp; ROI ANALYSIS');
    expect(markup).not.toContain('Major Equipment');
    expect(markup).not.toContain('Roof Racking Hardware');
    expect(markup).not.toContain('Switchgear &amp; Protection');
  });

  it('renders ROI and subtotals when localStorage indicates expanded', () => {
    localStorage.setItem('kito_show_financial_roi_details', 'true');
    const markup = renderToStaticMarkup(createElement(ProjectCostSummaryCard));

    expect(markup).toContain('ESTIMATED SYSTEM TOTAL INVESTMENT');
    expect(markup).toContain('Hide ROI &amp; Subtotals');

    // Expanded details are revealed
    expect(markup).toContain('FINANCIAL SAVINGS &amp; ROI ANALYSIS');
    expect(markup).toContain('Major Equipment');
    expect(markup).toContain('Roof Racking Hardware');
    expect(markup).toContain('Switchgear &amp; Protection');
  });

  it('maintains proper accessibility aria-expanded attribute on toggle element', () => {
    const collapsedMarkup = renderToStaticMarkup(createElement(ProjectCostSummaryCard));
    expect(collapsedMarkup).toContain('aria-expanded="false"');

    localStorage.setItem('kito_show_financial_roi_details', 'true');
    const expandedMarkup = renderToStaticMarkup(createElement(ProjectCostSummaryCard));
    expect(expandedMarkup).toContain('aria-expanded="true"');
  });
});
