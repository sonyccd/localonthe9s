import type { ForecastPageConfig } from '../types.ts';

export function renderForecast(config: ForecastPageConfig): HTMLElement {
  const container = document.createElement('div');

  if (config.title) {
    const title = document.createElement('div');
    title.className = 'page-title';
    title.textContent = config.title;
    container.appendChild(title);
  }

  const grid = document.createElement('div');
  grid.className = 'forecast-grid';

  for (const card of config.cards) {
    const cardEl = document.createElement('div');
    cardEl.className = 'forecast-card';

    const labelEl = document.createElement('div');
    labelEl.className = 'forecast-card-label';
    labelEl.textContent = card.label;
    cardEl.appendChild(labelEl);

    if (card.icon) {
      const iconEl = document.createElement('div');
      iconEl.className = 'forecast-card-icon';
      iconEl.textContent = card.icon;
      cardEl.appendChild(iconEl);
    }

    const primaryEl = document.createElement('div');
    primaryEl.className = 'forecast-card-primary';
    primaryEl.textContent = card.primary;
    cardEl.appendChild(primaryEl);

    if (card.secondary) {
      const secEl = document.createElement('div');
      secEl.className = 'forecast-card-secondary';
      secEl.textContent = card.secondary;
      cardEl.appendChild(secEl);
    }

    grid.appendChild(cardEl);
  }

  container.appendChild(grid);
  return container;
}
