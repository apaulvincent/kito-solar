import { describe, it, expect, vi } from 'vitest';
import { act, createElement } from 'react';
import { useNetworkStatus } from '../useNetworkStatus';
import { mountIntoDom } from '@/test/domTestUtils';

function NetworkStatusProbe({ onStatus }: { onStatus: (online: boolean) => void }) {
  const isOnline = useNetworkStatus();
  onStatus(isOnline);
  return null;
}

describe('useNetworkStatus Hook Suite', () => {
  it('detects online and offline events and cleans up event listeners', () => {
    let currentStatus = true;
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const mounted = mountIntoDom(
      createElement(NetworkStatusProbe, {
        onStatus: (online: boolean) => {
          currentStatus = online;
        },
      })
    );

    try {
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(currentStatus).toBe(true);

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });
      expect(currentStatus).toBe(false);

      act(() => {
        window.dispatchEvent(new Event('online'));
      });
      expect(currentStatus).toBe(true);
    } finally {
      mounted.unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    }
  });
});
