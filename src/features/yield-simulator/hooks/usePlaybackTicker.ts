// src/features/yield-simulator/hooks/usePlaybackTicker.ts
import { useEffect } from 'react';
import { useYieldSimulatorStore } from '../store/useYieldSimulatorStore';

/**
 * Drives the 96-step (15-min interval) time-lapse scrubber playback loop.
 * 1x = 550ms per 15-min step, 5x = 160ms per step, 15x = 60ms per step.
 */
export function usePlaybackTicker() {
  const isPlaying = useYieldSimulatorStore((s) => s.isPlaying);
  const playbackSpeed = useYieldSimulatorStore((s) => s.playbackSpeed);
  const stepForward = useYieldSimulatorStore((s) => s.stepForward);

  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs =
      playbackSpeed === 15 ? 60 : playbackSpeed === 5 ? 160 : 550;

    const timer = window.setInterval(() => {
      stepForward();
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed, stepForward]);
}
