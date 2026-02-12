import type { PageConfig } from '../types.ts';
import { renderDataGrid } from './DataGridPanel.ts';
import { renderForecast } from './ForecastPanel.ts';
import { renderTable } from './TablePanel.ts';
import { renderFreeform } from './FreeformPanel.ts';
import { renderBarChart } from './BarChartPanel.ts';

export function renderPage(config: PageConfig): HTMLElement {
  switch (config.type) {
    case 'data-grid':
      return renderDataGrid(config);
    case 'forecast':
      return renderForecast(config);
    case 'table':
      return renderTable(config);
    case 'freeform':
      return renderFreeform(config);
    case 'bar-chart':
      return renderBarChart(config);
    default:
      const fallback = document.createElement('div');
      fallback.className = 'freeform-content';
      fallback.textContent = `Unknown page type: ${(config as PageConfig).type}`;
      return fallback;
  }
}
