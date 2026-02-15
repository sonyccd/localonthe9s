import { describe, it, expect } from 'vitest';
import { renderDataGrid } from './DataGridPanel.ts';
import type { DataGridPageConfig } from '../types.ts';

describe('renderDataGrid', () => {
  const config: DataGridPageConfig = {
    type: 'data-grid',
    title: 'Current Conditions',
    rows: [
      { label: 'Temperature', value: '72F' },
      { label: 'Humidity', value: '65%' },
    ],
  };

  it('renders a title when provided', () => {
    const el = renderDataGrid(config);
    const title = el.querySelector('.page-title');
    expect(title!.textContent).toBe('Current Conditions');
  });

  it('omits title when not provided', () => {
    const noTitle: DataGridPageConfig = { type: 'data-grid', rows: [] };
    const el = renderDataGrid(noTitle);
    expect(el.querySelector('.page-title')).toBeNull();
  });

  it('creates one row per data entry', () => {
    const el = renderDataGrid(config);
    const rows = el.querySelectorAll('.data-grid-row');
    expect(rows.length).toBe(2);
  });

  it('sets label and value text correctly', () => {
    const el = renderDataGrid(config);
    const labels = el.querySelectorAll('.data-grid-label');
    const values = el.querySelectorAll('.data-grid-value');
    expect(labels[0].textContent).toBe('Temperature');
    expect(values[0].textContent).toBe('72F');
    expect(labels[1].textContent).toBe('Humidity');
    expect(values[1].textContent).toBe('65%');
  });

  it('creates the grid container with correct class', () => {
    const el = renderDataGrid(config);
    expect(el.querySelector('.data-grid')).not.toBeNull();
  });
});
