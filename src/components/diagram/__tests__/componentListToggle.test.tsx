// src/components/diagram/__tests__/componentListToggle.test.tsx
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DiagramComponentList } from '../DiagramComponentList';

describe('DiagramComponentList Show/Hide Toggle Suite', () => {
  const storeMap: Record<string, string> = {};

  beforeAll(() => {
    const mockStorage = {
      getItem: (key: string) => storeMap[key] ?? null,
      setItem: (key: string, value: string) => {
        storeMap[key] = String(value);
      },
      removeItem: (key: string) => {
        delete storeMap[key];
      },
      clear: () => {
        for (const k of Object.keys(storeMap)) {
          delete storeMap[k];
        }
      },
      length: 0,
      key: () => null,
    };

    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).window = globalThis;
  });

  afterAll(() => {
    delete (globalThis as any).localStorage;
    delete (globalThis as any).window;
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders with content hidden by default for clean visual ergonomics', () => {
    const markup = renderToStaticMarkup(createElement(DiagramComponentList));
    expect(markup).toContain('Single-Line Component Index');
    expect(markup).toContain('Show');
    expect(markup).not.toContain('Hide');
    // In collapsed mode, the individual node buttons are hidden
    expect(markup).not.toContain('Hover to highlight on diagram');
  });

  it('renders content when localStorage indicates show', () => {
    localStorage.setItem('kito_show_component_index', 'true');
    const markup = renderToStaticMarkup(createElement(DiagramComponentList));
    expect(markup).toContain('Single-Line Component Index');
    expect(markup).toContain('Hide');
    expect(markup).toContain('Hover to highlight on diagram');
    expect(markup).toContain('Solar PV Array');
  });
});
