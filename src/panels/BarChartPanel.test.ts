import { describe, it, expect } from 'vitest';
import { renderBarChart, lighten, darken } from './BarChartPanel.ts';
import type { BarChartPageConfig } from '../types.ts';

describe('lighten', () => {
  it('lightens pure black toward white', () => {
    // #000000 → each channel: 0 + (255-0)*0.35 = 89.25 → 89
    expect(lighten('#000000')).toBe('rgb(89, 89, 89)');
  });

  it('lightens a color by mixing 35% toward white', () => {
    // #ff0000 → r: 255+0*0.35=255, g: 0+255*0.35=89, b: 0+255*0.35=89
    expect(lighten('#ff0000')).toBe('rgb(255, 89, 89)');
  });
});

describe('darken', () => {
  it('darkens pure white by 55%', () => {
    // #ffffff → each channel: 255 * 0.45 = 114.75 → 115
    expect(darken('#ffffff')).toBe('rgb(115, 115, 115)');
  });

  it('darkens pure black to black', () => {
    expect(darken('#000000')).toBe('rgb(0, 0, 0)');
  });
});

describe('renderBarChart', () => {
  const config: BarChartPageConfig = {
    type: 'bar-chart',
    title: 'Test Chart',
    bars: [
      { label: 'Mon', value: 10 },
      { label: 'Tue', value: 20, color: '#3366ff' },
    ],
    unit: '%',
  };

  it('renders a title when provided', () => {
    const el = renderBarChart(config);
    const title = el.querySelector('.page-title');
    expect(title).not.toBeNull();
    expect(title!.textContent).toBe('Test Chart');
  });

  it('omits title when not provided', () => {
    const noTitle: BarChartPageConfig = { type: 'bar-chart', bars: [] };
    const el = renderBarChart(noTitle);
    expect(el.querySelector('.page-title')).toBeNull();
  });

  it('creates one column per bar', () => {
    const el = renderBarChart(config);
    const cols = el.querySelectorAll('.bar-chart-col');
    expect(cols.length).toBe(2);
  });

  it('shows value with unit', () => {
    const el = renderBarChart(config);
    const values = el.querySelectorAll('.bar-chart-value');
    expect(values[0].textContent).toBe('10%');
    expect(values[1].textContent).toBe('20%');
  });

  it('sets bar height as percentage of max', () => {
    const el = renderBarChart(config);
    const bars = el.querySelectorAll('.bar-chart-bar') as NodeListOf<HTMLElement>;
    // Max is 20. First bar: (10/20)*85=42.5%, Second: (20/20)*85=85%
    expect(bars[0].style.height).toBe('42.5%');
    expect(bars[1].style.height).toBe('85%');
  });

  it('uses custom maxValue when provided', () => {
    const withMax: BarChartPageConfig = {
      type: 'bar-chart',
      bars: [{ label: 'A', value: 50 }],
      maxValue: 100,
    };
    const el = renderBarChart(withMax);
    const bar = el.querySelector('.bar-chart-bar') as HTMLElement;
    expect(bar.style.height).toBe('42.5%');
  });

  it('handles zero maxValue gracefully', () => {
    const zeroMax: BarChartPageConfig = {
      type: 'bar-chart',
      bars: [{ label: 'A', value: 0 }],
      maxValue: 0,
    };
    const el = renderBarChart(zeroMax);
    const bar = el.querySelector('.bar-chart-bar') as HTMLElement;
    expect(bar.style.height).toBe('0%');
  });

  it('applies custom bar color to front/top/right faces', () => {
    const el = renderBarChart(config);
    const cols = el.querySelectorAll('.bar-chart-col');
    const coloredCol = cols[1]; // second bar has color
    const front = coloredCol.querySelector('.bar-face-front') as HTMLElement;
    const top = coloredCol.querySelector('.bar-face-top') as HTMLElement;
    const right = coloredCol.querySelector('.bar-face-right') as HTMLElement;

    expect(front.style.background).toBe('#3366ff');
    expect(top.style.background).toBe(lighten('#3366ff'));
    expect(right.style.background).toBe(darken('#3366ff'));
  });

  it('sets staggered animation delays', () => {
    const el = renderBarChart(config);
    const bars = el.querySelectorAll('.bar-chart-bar') as NodeListOf<HTMLElement>;
    expect(bars[0].style.animationDelay).toBe('0s');
    expect(bars[1].style.animationDelay).toBe('0.12s');
  });

  it('renders bottom labels', () => {
    const el = renderBarChart(config);
    const labels = el.querySelectorAll('.bar-chart-label');
    expect(labels[0].textContent).toBe('Mon');
    expect(labels[1].textContent).toBe('Tue');
  });
});
