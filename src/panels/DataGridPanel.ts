import type { DataGridPageConfig } from '../types.ts';

export function renderDataGrid(config: DataGridPageConfig): HTMLElement {
  const container = document.createElement('div');

  if (config.title) {
    const title = document.createElement('div');
    title.className = 'page-title';
    title.textContent = config.title;
    container.appendChild(title);
  }

  const grid = document.createElement('div');
  grid.className = 'data-grid';

  for (const row of config.rows) {
    const rowEl = document.createElement('div');
    rowEl.className = 'data-grid-row';

    const labelEl = document.createElement('span');
    labelEl.className = 'data-grid-label';
    labelEl.textContent = row.label;

    const valueEl = document.createElement('span');
    valueEl.className = 'data-grid-value';
    valueEl.textContent = row.value;

    rowEl.appendChild(labelEl);
    rowEl.appendChild(valueEl);
    grid.appendChild(rowEl);
  }

  container.appendChild(grid);
  return container;
}
