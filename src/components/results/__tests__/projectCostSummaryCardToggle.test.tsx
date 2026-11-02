// src/components/results/__tests__/projectCostSummaryCardToggle.test.tsx
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProjectCostSummaryCard } from '../ProjectCostSummaryCard';

describe('ProjectCostSummaryCard Show/Hide Toggle & Default Hidden Suite', () => {
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

  it('renders with details collapsed/hidden by default to prevent screen clutter', () => {
    const markup = renderToStaticMarkup(createElement(ProjectCostSummaryCard));

    // Header and high-level summary remain accessible
    expect(markup).toContain('FINANCIALS &amp; BILL OF MATERIALS (BOM)');
    expect(markup).toContain('Estimated Project Investment');
    expect(markup).toContain('Show');
    expect(markup).not.toContain('>Hide<');

    // Dense body sections must be hidden by default
    expect(markup).not.toContain('ESTIMATED SYSTEM TOTAL INVESTMENT');
    expect(markup).not.toContain('FINANCIAL SAVINGS &amp; ROI ANALYSIS');
    expect(markup).not.toContain('Major Equipment');
    expect(markup).not.toContain('Roof Racking Hardware');
    expect(markup).not.toContain('Switchgear &amp; Protection');
  });

  it('renders full financial details when localStorage indicates expanded', () => {
    localStorage.setItem('kito_show_cost_summary', 'true');
    const markup = renderToStaticMarkup(createElement(ProjectCostSummaryCard));

    expect(markup).toContain('FINANCIALS &amp; BILL OF MATERIALS (BOM)');
    expect(markup).toContain('Estimated Project Investment');
    expect(markup).toContain('Hide');

    // Expanded details are rendered
    expect(markup).toContain('ESTIMATED SYSTEM TOTAL INVESTMENT');
    expect(markup).toContain('FINANCIAL SAVINGS &amp; ROI ANALYSIS');
    expect(markup).toContain('Major Equipment');
    expect(markup).toContain('Roof Racking Hardware');
    expect(markup).toContain('Switchgear &amp; Protection');
    expect(markup).toContain('View Itemized Pricing');
  });

  it('has proper accessibility aria-expanded attribute on toggle elements', () => {
    const collapsedMarkup = renderToStaticMarkup(createElement(ProjectCostSummaryCard));
    expect(collapsedMarkup).toContain('aria-expanded="false"');

    localStorage.setItem('kito_show_cost_summary', 'true');
    const expandedMarkup = renderToStaticMarkup(createElement(ProjectCostSummaryCard));
    expect(expandedMarkup).toContain('aria-expanded="true"');
  });
});
