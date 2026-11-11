import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Autocomplete, HighlightMatch } from '../Autocomplete';

describe('Autocomplete Component Suite', () => {
  interface MockItem {
    id: string;
    name: string;
    ratingKw: number;
  }

  const mockItems: MockItem[] = [
    { id: '1', name: 'Deye 5kW Hybrid', ratingKw: 5 },
    { id: '2', name: 'Growatt 10kW String', ratingKw: 10 },
    { id: '3', name: 'Sol-Ark 15kW Hybrid', ratingKw: 15 },
  ];

  it('renders input with initial value and placeholder', () => {
    const html = renderToStaticMarkup(
      createElement(Autocomplete<MockItem>, {
        options: mockItems,
        value: mockItems[0],
        onChange: vi.fn(),
        getOptionLabel: (item) => item.name,
        placeholder: 'Search inverter...',
      })
    );

    expect(html).toContain('value="Deye 5kW Hybrid"');
    expect(html).toContain('placeholder="Search inverter..."');
  });

  it('highlights all repeated occurrences of query without stateful regex drift', () => {
    const html = renderToStaticMarkup(
      createElement(HighlightMatch, {
        text: '5K-SUN-5K-Hybrid-5k',
        query: '5K',
      })
    );

    const markCount = (html.match(/<mark\b/g) || []).length;
    expect(markCount).toBe(3);
    expect(html).toContain('>5K</mark>');
    expect(html).toContain('>5k</mark>');
  });

  it('renders plain span when HighlightMatch query is empty', () => {
    const html = renderToStaticMarkup(
      createElement(HighlightMatch, {
        text: 'Powerwall 2',
        query: '',
      })
    );

    expect(html).toBe('<span>Powerwall 2</span>');
  });

  it('renders clean options list without header count or sort dropdown', () => {
    const html = renderToStaticMarkup(
      createElement(Autocomplete<MockItem>, {
        options: mockItems,
        value: mockItems[0],
        onChange: vi.fn(),
        getOptionLabel: (item) => item.name,
      })
    );

    expect(html).not.toContain('SORT:');
    expect(html).not.toContain('options for');
  });
});
