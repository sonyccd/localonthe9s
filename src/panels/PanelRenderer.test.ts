import { describe, it, expect } from 'vitest';
import { renderPage } from './PanelRenderer.ts';
import type { PageConfig } from '../types.ts';

describe('renderPage', () => {
  it('dispatches data-grid type', () => {
    const el = renderPage({
      type: 'data-grid',
      rows: [{ label: 'A', value: 'B' }],
    });
    expect(el.querySelector('.data-grid')).not.toBeNull();
  });

  it('dispatches forecast type', () => {
    const el = renderPage({
      type: 'forecast',
      cards: [{ label: 'Mon', primary: '70' }],
    });
    expect(el.querySelector('.forecast-grid')).not.toBeNull();
  });

  it('dispatches table type', () => {
    const el = renderPage({
      type: 'table',
      columns: ['A'],
      rows: [['1']],
    });
    expect(el.querySelector('.data-table')).not.toBeNull();
  });

  it('dispatches freeform type', () => {
    const el = renderPage({
      type: 'freeform',
      html: '<p>test</p>',
    });
    expect(el.querySelector('.freeform-content')).not.toBeNull();
  });

  it('dispatches bar-chart type', () => {
    const el = renderPage({
      type: 'bar-chart',
      bars: [{ label: 'A', value: 10 }],
    });
    expect(el.querySelector('.bar-chart')).not.toBeNull();
  });

  it('returns fallback for unknown type', () => {
    const el = renderPage({ type: 'alien' } as unknown as PageConfig);
    expect(el.textContent).toContain('Unknown page type');
    expect(el.className).toBe('freeform-content');
  });
});
