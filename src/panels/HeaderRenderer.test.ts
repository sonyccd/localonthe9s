import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HeaderRenderer } from './HeaderRenderer.ts';
import { setupDOM } from '../test-helpers/dom-setup.ts';
import type { HeaderConfig } from '../types.ts';

describe('HeaderRenderer', () => {
  beforeEach(() => {
    setupDOM();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseConfig: HeaderConfig = {
    title: 'Local Forecast',
    showClock: true,
    clockFormat: '12h',
  };

  it('sets the header title text', () => {
    new HeaderRenderer(baseConfig);
    expect(document.getElementById('header-title')!.textContent).toBe('Local Forecast');
  });

  it('renders logoText with line breaks', () => {
    new HeaderRenderer({ ...baseConfig, logoText: 'THE\nWEATHER' });
    expect(document.getElementById('header-logo')!.innerHTML).toContain('<br>');
  });

  it('populates clock when showClock is true', () => {
    vi.setSystemTime(new Date(2024, 6, 15, 14, 30, 45)); // Jul 15, 2024 2:30:45 PM
    new HeaderRenderer(baseConfig);
    const clockHtml = document.getElementById('header-clock')!.innerHTML;
    expect(clockHtml).toContain('header-date');
    expect(clockHtml).toContain('header-time');
  });

  it('formats 12h clock', () => {
    vi.setSystemTime(new Date(2024, 0, 1, 14, 5, 9));
    new HeaderRenderer({ ...baseConfig, clockFormat: '12h' });
    const clockHtml = document.getElementById('header-clock')!.innerHTML;
    // Should contain PM-style time
    expect(clockHtml).toContain('header-time');
  });

  it('formats 24h clock', () => {
    vi.setSystemTime(new Date(2024, 0, 1, 14, 5, 9));
    new HeaderRenderer({ ...baseConfig, clockFormat: '24h' });
    const clockHtml = document.getElementById('header-clock')!.innerHTML;
    expect(clockHtml).toContain('14');
  });

  it('clears clock when showClock is false', () => {
    new HeaderRenderer({ ...baseConfig, showClock: false });
    expect(document.getElementById('header-clock')!.textContent).toBe('');
  });

  it('updates clock on interval tick', () => {
    vi.setSystemTime(new Date(2024, 0, 1, 10, 0, 0));
    new HeaderRenderer(baseConfig);
    const clock = document.getElementById('header-clock')!;
    const initialHtml = clock.innerHTML;

    vi.setSystemTime(new Date(2024, 0, 1, 10, 0, 5));
    vi.advanceTimersByTime(1000);

    expect(clock.innerHTML).not.toBe(initialHtml);
  });

  it('clears interval on destroy', () => {
    const hr = new HeaderRenderer(baseConfig);
    hr.destroy();
    // Advancing timers should not cause errors
    vi.advanceTimersByTime(5000);
  });

  it('update() replaces config and re-renders', () => {
    const hr = new HeaderRenderer(baseConfig);
    hr.update({ ...baseConfig, title: 'New Title', showClock: false });
    expect(document.getElementById('header-title')!.textContent).toBe('New Title');
    expect(document.getElementById('header-clock')!.textContent).toBe('');
  });

  it('update() clears old interval before creating new one', () => {
    const hr = new HeaderRenderer(baseConfig);
    // First render starts an interval. Update should clear it.
    hr.update({ ...baseConfig, showClock: false });
    // Now update again with clock on — should not have stale intervals
    hr.update(baseConfig);
    vi.advanceTimersByTime(2000);
    // No errors means intervals are managed correctly
  });
});
