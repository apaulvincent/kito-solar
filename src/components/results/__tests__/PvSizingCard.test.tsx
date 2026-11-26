import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PvSizingCard } from '../PvSizingCard';
import { useCalculatorStore } from '@/store/useCalculatorStore';

describe('PvSizingCard Component & Temperature Derating Suite', () => {
  it('renders array sizing cards and temperature derating metrics without NaN or undefined', () => {
    const markup = renderToStaticMarkup(createElement(PvSizingCard));

    expect(markup).toContain('Photovoltaic Sizing Matrix');
    expect(markup).toContain('Minimum Panels');
    expect(markup).toContain('Recommended Panels');
    expect(markup).toContain('Maximum Panels');
    expect(markup).toContain('Temperature Derating &amp; Safety Verification (PEC 6.90.1.7)');
    expect(markup).toContain('Cold String Voc');
    expect(markup).toContain('Hot String Vmp');
    expect(markup).toContain('Cold Voc / Module');
    expect(markup).toContain('Hot Vmp / Module');

    expect(markup).not.toContain('NaN');
    expect(markup).not.toContain('undefined');
    expect(markup).not.toContain('—'); // Zero em dashes
  });

  it('renders detailed thermal advisory when step2DetailMode is detailed', () => {
    useCalculatorStore.getState().setStep2DetailMode('detailed');
    const markup = renderToStaticMarkup(createElement(PvSizingCard));

    expect(markup).toContain('Temperature derating verified per PEC 2017');
    expect(markup).toContain('THERMAL BOUNDS SAFE');
    expect(markup).not.toContain('—');
  });
});
