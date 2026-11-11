import { act, ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { User } from '@supabase/supabase-js';

export function mountIntoDom(element: ReactElement): {
  container: HTMLDivElement;
  rerender: (next: ReactElement) => void;
  unmount: () => void;
} {
  const g = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const prevActEnv = g.IS_REACT_ACT_ENVIRONMENT;
  g.IS_REACT_ACT_ENVIRONMENT = true;

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(element);
  });

  return {
    container,
    rerender: (next: ReactElement) => {
      act(() => {
        root.render(next);
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
      if (prevActEnv === undefined) {
        delete g.IS_REACT_ACT_ENVIRONMENT;
      } else {
        g.IS_REACT_ACT_ENVIRONMENT = prevActEnv;
      }
    },
  };
}

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'usr_test_123',
    email: 'engineer@kitosolar.com',
    app_metadata: {},
    user_metadata: { full_name: 'Solar Engineer' },
    aud: 'authenticated',
    created_at: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}
