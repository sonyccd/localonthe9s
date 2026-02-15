import { describe, it, expect } from 'vitest';
import { renderForecast } from './ForecastPanel.ts';
import type { ForecastPageConfig } from '../types.ts';

describe('renderForecast', () => {
  const config: ForecastPageConfig = {
    type: 'forecast',
    title: '5-Day Forecast',
    cards: [
      { label: 'Mon', icon: 'sun', primary: '78', secondary: 'Lo 62' },
      { label: 'Tue', primary: '74' },
    ],
  };

  it('renders a title', () => {
    const el = renderForecast(config);
    expect(el.querySelector('.page-title')!.textContent).toBe('5-Day Forecast');
  });

  it('omits title when not provided', () => {
    const noTitle: ForecastPageConfig = { type: 'forecast', cards: [] };
    const el = renderForecast(noTitle);
    expect(el.querySelector('.page-title')).toBeNull();
  });

  it('creates one card per entry', () => {
    const el = renderForecast(config);
    expect(el.querySelectorAll('.forecast-card').length).toBe(2);
  });

  it('renders icon when present', () => {
    const el = renderForecast(config);
    const cards = el.querySelectorAll('.forecast-card');
    expect(cards[0].querySelector('.forecast-card-icon')!.textContent).toBe('sun');
    expect(cards[1].querySelector('.forecast-card-icon')).toBeNull();
  });

  it('renders primary text', () => {
    const el = renderForecast(config);
    const primaries = el.querySelectorAll('.forecast-card-primary');
    expect(primaries[0].textContent).toBe('78');
  });

  it('renders secondary text when present', () => {
    const el = renderForecast(config);
    const cards = el.querySelectorAll('.forecast-card');
    expect(cards[0].querySelector('.forecast-card-secondary')!.textContent).toBe('Lo 62');
    expect(cards[1].querySelector('.forecast-card-secondary')).toBeNull();
  });
});
