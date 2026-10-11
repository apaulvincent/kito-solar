// src/components/results/__tests__/MountingBomCard.test.tsx
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MountingBomCard } from '../MountingBomCard';

describe('MountingBomCard Component & Accessibility Remediation', () => {
  const componentPath = path.resolve(process.cwd(), 'src/components/results/MountingBomCard.tsx');
  const sourceCode = fs.readFileSync(componentPath, 'utf-8');

  it('renders without throwing and contains essential BOM sections', () => {
    const markup = renderToStaticMarkup(createElement(MountingBomCard));
    expect(markup).toBeTruthy();
    expect(markup).toContain('BILL OF MATERIALS (BOM)');
    expect(markup).toContain('Roof Mounting Hardware');
    expect(markup).not.toContain('NaN');
    expect(markup).not.toContain('undefined');
  });

  it('includes useEffect keyboard listener for Escape key dismissal', () => {
    expect(sourceCode).toContain("e.key === 'Escape'");
    expect(sourceCode).toContain("window.addEventListener('keydown'");
    expect(sourceCode).toContain("window.removeEventListener('keydown'");
    expect(sourceCode).toContain('setInspectedItem(null)');
  });

  it('implements backdrop click dismissal with stopPropagation on modal container', () => {
    expect(sourceCode).toContain('onClick={() => setInspectedItem(null)}');
    expect(sourceCode).toContain('onClick={(e) => e.stopPropagation()}');
  });

  it('includes proper ARIA accessibility attributes on the dialog and header title', () => {
    expect(sourceCode).toContain('role="dialog"');
    expect(sourceCode).toContain('aria-modal="true"');
    expect(sourceCode).toContain('aria-labelledby="cad-dialog-title"');
    expect(sourceCode).toContain('id="cad-dialog-title"');
  });

  it('complies with WCAG AA contrast (>= 4.5:1) by replacing low-contrast text-slate-400 captions', () => {
    // Verified that dimension captions use text-slate-600 dark:text-slate-400
    expect(sourceCode).toContain('text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase block">Length');
    expect(sourceCode).toContain('text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase block">Width / Flange');
    expect(sourceCode).toContain('text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase block">Height / Depth');
    expect(sourceCode).toContain('text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase block">Wall Thickness');

    // Verified that spec matrix labels use text-slate-600 dark:text-slate-400
    expect(sourceCode).toContain('text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Dimensions &amp; Profile');
    expect(sourceCode).toContain('text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Alloy &amp; Composition');
    expect(sourceCode).toContain('text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Fastener Hardware');
    expect(sourceCode).toContain('text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Tightening Torque');
    expect(sourceCode).toContain('text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Wind / Snow Load Capacity');
    expect(sourceCode).toContain('text-[10px] font-mono text-slate-600 dark:text-slate-400 block">Corrosion Protection');
    expect(sourceCode).toContain('text-[10px] font-mono text-slate-600 dark:text-slate-400">Certified Standards:');

    // Ensure no bare text-slate-400 classes exist on text elements
    const bareSlate400Matches = sourceCode.match(/class="[^"]*\btext-slate-400\b(?!\s*dark:)[^"]*"/g) || [];
    expect(bareSlate400Matches).toEqual([]);
  });

  it('renders accessory name, quantity, and info basis in minimum detail mode, hiding dimensions, torque, spec box, and footer', async () => {
    const { useCalculatorStore } = await import('@/store/useCalculatorStore');
    
    // Set to min mode
    useCalculatorStore.getState().setStep2DetailMode('min');
    const minMarkup = renderToStaticMarkup(createElement(MountingBomCard));

    expect(minMarkup).toContain('pcs');
    expect(minMarkup).toContain('RAIL SPLICE');
    expect(minMarkup).toContain('Provides mechanical continuity');
    expect(minMarkup).not.toContain('<span>CAD</span>');
    expect(minMarkup).not.toContain('Torque:');

    // Set to detailed mode
    useCalculatorStore.getState().setStep2DetailMode('detailed');
    const detailedMarkup = renderToStaticMarkup(createElement(MountingBomCard));

    expect(detailedMarkup).toContain('pcs');
    expect(detailedMarkup).toContain('Provides mechanical continuity');
    expect(detailedMarkup).toContain('<span>CAD</span>');
    expect(detailedMarkup).toContain('Torque:');

    // Reset back to default min mode
    useCalculatorStore.getState().setStep2DetailMode('min');
  });
});
