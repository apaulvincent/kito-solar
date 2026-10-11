// src/components/diagram/__tests__/schematic2dRealism.test.tsx
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Schematic2DView } from '../Schematic2DView';

describe('2D Schematic CAD Alignment & Realism', () => {
  it('renders 2D single-line diagram with widened layout spine and animated conduits', () => {
    const html = renderToStaticMarkup(createElement(Schematic2DView));
    expect(html).toContain('min-w-[1580px]');
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

  it('verifies Main Panel precedes ATS Switch and ATS Switch precedes Building Load', () => {
    const html = renderToStaticMarkup(createElement(Schematic2DView));
    const mainPanelIndex = html.indexOf('MAIN PANEL');
    const atsIndex = html.indexOf('ATS SWITCH');
    const loadIndex = html.indexOf('BUILDING LOAD');

    expect(mainPanelIndex).toBeGreaterThan(0);
    expect(atsIndex).toBeGreaterThan(0);
    expect(loadIndex).toBeGreaterThan(0);

    // Sequence: Main Panel (MDB 01) -> ATS Switch (XFER ATS) -> Building Load
    expect(mainPanelIndex).toBeLessThan(atsIndex);
    expect(atsIndex).toBeLessThan(loadIndex);
  });

  it('renders Utility Grid connected to Main Panel and includes interactive zoom/pan controls', () => {
    const html = renderToStaticMarkup(createElement(Schematic2DView));
    // Utility Grid service drop is present
    expect(html).toContain('SRV • GRID');
    expect(html).toContain('UTILITY GRID');

    // Pan/Zoom HUD controls
    expect(html).toContain('100%');
    expect(html).toContain('Drag to pan • Scroll to zoom • Double-click to reset');
  });

  it('includes animated traveling current beads along conduit runs', () => {
    const html = renderToStaticMarkup(createElement(Schematic2DView));
    // SVG SMIL animations for electricity flow
    expect(html).toContain('<animate attributeName="cx"');
    expect(html).toContain('repeatCount="indefinite"');
  });
});
