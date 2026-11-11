import { describe, it, expect } from 'vitest';
import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MountingBomCard } from '../MountingBomCard';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { mountIntoDom } from '@/test/domTestUtils';

describe('MountingBomCard Component & Accessibility Suite', () => {
  it('renders essential BOM sections without NaN or undefined', () => {
    const markup = renderToStaticMarkup(createElement(MountingBomCard));
    expect(markup).toContain('BILL OF MATERIALS (BOM)');
    expect(markup).toContain('Roof Mounting Hardware');
    expect(markup).not.toContain('NaN');
    expect(markup).not.toContain('undefined');
  });

  it('opens CAD inspection dialog with accessible ARIA tags, contrast classes, and Escape dismissal', () => {
    const mounted = mountIntoDom(createElement(MountingBomCard));
    try {
      const inspectBtn = mounted.container.querySelector<HTMLButtonElement>(
        'button[aria-label*="CAD specifications"]'
      );
      expect(inspectBtn).not.toBeNull();

      act(() => {
        inspectBtn?.click();
      });

      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.getAttribute('aria-modal')).toBe('true');
      expect(dialog?.getAttribute('aria-labelledby')).toBe('cad-dialog-title');
      expect(dialog?.querySelector('#cad-dialog-title')).not.toBeNull();
      expect(dialog?.innerHTML).toContain('<svg');
      expect(dialog?.textContent).toContain('Measured Millimeter Dimensions');
      expect(dialog?.textContent).toContain('Engineering Specifications & Standards');

      const lengthLabel = Array.from(dialog?.querySelectorAll('span') || []).find(
        (el) => el.textContent?.trim() === 'Length'
      );
      expect(lengthLabel?.className).toContain('text-slate-600');
      expect(lengthLabel?.className).toContain('dark:text-slate-400');

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
      expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    } finally {
      mounted.unmount();
    }
  });

  it('hides detailed specs in min mode and reveals them in detailed mode', () => {
    useCalculatorStore.getState().setStep2DetailMode('min');
    const minMarkup = renderToStaticMarkup(createElement(MountingBomCard));

    expect(minMarkup).toContain('pcs');
    expect(minMarkup).toContain('RAIL SPLICE');
    expect(minMarkup).toContain('Provides mechanical continuity');
    expect(minMarkup).not.toContain('<span>CAD</span>');
    expect(minMarkup).not.toContain('Torque:');

    useCalculatorStore.getState().setStep2DetailMode('detailed');
    const detailedMarkup = renderToStaticMarkup(createElement(MountingBomCard));

    expect(detailedMarkup).toContain('pcs');
    expect(detailedMarkup).toContain('Provides mechanical continuity');
    expect(detailedMarkup).toContain('<span>CAD</span>');
    expect(detailedMarkup).toContain('Torque:');

    useCalculatorStore.getState().setStep2DetailMode('min');
  });
});
