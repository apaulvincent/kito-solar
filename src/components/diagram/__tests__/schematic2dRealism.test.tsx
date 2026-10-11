// src/components/diagram/__tests__/schematic2dRealism.test.tsx
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Schematic2DView } from '../Schematic2DView';

describe('2D Schematic CAD Alignment & Realism', () => {
  it('renders 2D single-line diagram with widened layout spine and animated conduits', () => {
    const html = renderToStaticMarkup(createElement(Schematic2DView));
    expect(html).toContain('min-w-[1560px]');
    expect(html).toContain('Single-Line Diagram (SLD)');
    expect(html).toContain('PV ARRAY');
    expect(html).toContain('DC ISOLATOR');
    expect(html).toContain('DC BREAKER');
    expect(html).toContain('AC BREAKER');
    expect(html).toContain('AC ISOLATOR');
    expect(html).toContain('MAIN PANEL');
    expect(html).toContain('ATS SWITCH');
    expect(html).toContain('UTILITY GRID');
    expect(html).toContain('BUILDING LOAD');
  });

  it('verifies Main Panel precedes ATS Switch in 2D sequence matching 3D layout', () => {
    const html = renderToStaticMarkup(createElement(Schematic2DView));
    const mainPanelIndex = html.indexOf('MAIN PANEL');
    const atsIndex = html.indexOf('ATS SWITCH');

    expect(mainPanelIndex).toBeGreaterThan(0);
    expect(atsIndex).toBeGreaterThan(0);
    // Main Panel (MDB 01) must come BEFORE ATS Switch (XFER ATS)
    expect(mainPanelIndex).toBeLessThan(atsIndex);
  });

  it('includes animated traveling current beads along conduit runs', () => {
    const html = renderToStaticMarkup(createElement(Schematic2DView));
    // SVG SMIL animations for electricity flow
    expect(html).toContain('<animate attributeName="cx"');
    expect(html).toContain('repeatCount="indefinite"');
  });
});
