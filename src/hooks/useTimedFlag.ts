import { useCallback, useEffect, useRef, useState } from 'react';

export function useTimedFlag(durationMs = 3000): [boolean, () => void] {
  const [active, setActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const trigger = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    setActive(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setActive(false);
    }, durationMs);
  }, [durationMs]);

  return [active, trigger];
}
