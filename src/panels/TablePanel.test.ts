import { describe, it, expect } from 'vitest';
import { renderTable } from './TablePanel.ts';
import type { TablePageConfig } from '../types.ts';

describe('renderTable', () => {
  const config: TablePageConfig = {
    type: 'table',
    title: 'Stats',
    columns: ['Name', 'Value'],
    rows: [
      ['Temp', '72F'],
      ['Wind', '8mph'],
    ],
  };

  it('renders a title', () => {
    const el = renderTable(config);
    expect(el.querySelector('.page-title')!.textContent).toBe('Stats');
  });

  it('omits title when not provided', () => {
    const noTitle: TablePageConfig = { type: 'table', columns: [], rows: [] };
    const el = renderTable(noTitle);
    expect(el.querySelector('.page-title')).toBeNull();
  });

  it('creates thead with column headers', () => {
    const el = renderTable(config);
    const ths = el.querySelectorAll('thead th');
    expect(ths.length).toBe(2);
    expect(ths[0].textContent).toBe('Name');
    expect(ths[1].textContent).toBe('Value');
  });

  it('creates tbody rows with cells', () => {
    const el = renderTable(config);
    const trs = el.querySelectorAll('tbody tr');
    expect(trs.length).toBe(2);
    const cells = trs[0].querySelectorAll('td');
    expect(cells[0].textContent).toBe('Temp');
    expect(cells[1].textContent).toBe('72F');
  });

  it('applies the data-table class', () => {
    const el = renderTable(config);
    expect(el.querySelector('.data-table')).not.toBeNull();
  });
});
