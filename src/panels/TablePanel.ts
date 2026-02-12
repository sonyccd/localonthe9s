import type { TablePageConfig } from '../types.ts';

export function renderTable(config: TablePageConfig): HTMLElement {
  const container = document.createElement('div');

  if (config.title) {
    const title = document.createElement('div');
    title.className = 'page-title';
    title.textContent = config.title;
    container.appendChild(title);
  }

  const table = document.createElement('table');
  table.className = 'data-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const col of config.columns) {
    const th = document.createElement('th');
    th.textContent = col;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const row of config.rows) {
    const tr = document.createElement('tr');
    for (const cell of row) {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  container.appendChild(table);
  return container;
}
