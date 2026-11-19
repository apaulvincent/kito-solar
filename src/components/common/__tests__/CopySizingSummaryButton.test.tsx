import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, createElement } from 'react';
import { CopySizingSummaryButton, buildSizingSummaryText } from '../CopySizingSummaryButton';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { mountIntoDom } from '@/test/domTestUtils';

describe('CopySizingSummaryButton & Text Generator Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds a clean, deterministic plain-text technical sizing schedule', () => {
    const state = useCalculatorStore.getState();
    const text = buildSizingSummaryText({
      calculationResult: state.calculationResult,
      selectedInverter: state.selectedInverter,
      selectedModule: state.selectedModule,
      selectedBattery: state.selectedBattery,
      batteryCount: state.batteryCount,
      gridVoltageV: state.gridVoltageV,
      mainBreakerA: state.mainBreakerA,
    });

    expect(text).toContain('KITO SOLAR | SYSTEM SIZING & ELECTRICAL SCHEDULE');
    expect(text).toContain('Philippine Electrical Code (PEC 2017)');
    expect(text).toContain('EQUIPMENT SPECIFICATIONS:');
    expect(text).toContain('DC ELECTRICAL SCHEDULE (Array to Inverter):');
    expect(text).toContain('AC ELECTRICAL SCHEDULE (Inverter to Distribution):');
    expect(text).toContain('Generated via Kito Solar (https://kitosolar.pvdeo.com)');
    expect(text).not.toContain('—'); // No em dashes in output
  });

  it('copies technical summary to clipboard and displays copied confirmation state', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const mounted = mountIntoDom(createElement(CopySizingSummaryButton));

    try {
      const button = mounted.container.querySelector('button');
      expect(button).not.toBeNull();
      expect(button?.textContent).toContain('Copy Schedule');

      await act(async () => {
        button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(writeTextMock).toHaveBeenCalledTimes(1);
      const copiedText = writeTextMock.mock.calls[0][0];
      expect(copiedText).toContain('KITO SOLAR | SYSTEM SIZING & ELECTRICAL SCHEDULE');
      expect(button?.textContent).toContain('Copied Schedule!');
    } finally {
      mounted.unmount();
    }
  });
});
