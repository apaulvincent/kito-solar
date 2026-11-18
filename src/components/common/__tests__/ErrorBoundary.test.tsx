import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, createElement, useState } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { mountIntoDom } from '@/test/domTestUtils';

function BombComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test crash in Three.js renderer');
  }
  return <div>Studio Rendered Successfully</div>;
}

function ResettableContainer({ onReset }: { onReset?: () => void }) {
  const [hasError, setHasError] = useState(true);

  return (
    <ErrorBoundary
      onReset={() => {
        onReset?.();
        setHasError(false);
      }}
    >
      <BombComponent shouldThrow={hasError} />
    </ErrorBoundary>
  );
}

describe('ErrorBoundary Component Suite', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    const mounted = mountIntoDom(
      createElement(ErrorBoundary, null, createElement(BombComponent, { shouldThrow: false }))
    );

    try {
      expect(mounted.container.textContent).toContain('Studio Rendered Successfully');
      expect(mounted.container.querySelector('[role="alert"]')).toBeNull();
    } finally {
      mounted.unmount();
    }
  });

  it('catches render error and shows fallback UI with diagnostic details', () => {
    const mounted = mountIntoDom(
      createElement(ErrorBoundary, null, createElement(BombComponent, { shouldThrow: true }))
    );

    try {
      const alert = mounted.container.querySelector('[role="alert"]');
      expect(alert).not.toBeNull();
      expect(mounted.container.textContent).toContain('Studio Rendering Disrupted');
      expect(mounted.container.textContent).toContain('Test crash in Three.js renderer');
      expect(mounted.container.textContent).toContain('Reload Studio');
      expect(mounted.container.textContent).toContain('Try Again');
      expect(mounted.container.textContent).toContain('Home');
    } finally {
      mounted.unmount();
    }
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom Fallback View</div>;
    const mounted = mountIntoDom(
      createElement(
        ErrorBoundary,
        { fallback: customFallback },
        createElement(BombComponent, { shouldThrow: true })
      )
    );

    try {
      expect(mounted.container.textContent).toContain('Custom Fallback View');
      expect(mounted.container.textContent).not.toContain('Studio Rendering Disrupted');
    } finally {
      mounted.unmount();
    }
  });

  it('calls onReset and recovers when Try Again is clicked', () => {
    const onResetSpy = vi.fn();
    const mounted = mountIntoDom(createElement(ResettableContainer, { onReset: onResetSpy }));

    try {
      expect(mounted.container.textContent).toContain('Studio Rendering Disrupted');

      const tryAgainBtn = Array.from(mounted.container.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('Try Again')
      );
      expect(tryAgainBtn).toBeDefined();

      act(() => {
        tryAgainBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(onResetSpy).toHaveBeenCalledTimes(1);
      expect(mounted.container.textContent).toContain('Studio Rendered Successfully');
    } finally {
      mounted.unmount();
    }
  });
});
