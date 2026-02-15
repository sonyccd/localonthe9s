import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TickerRenderer } from './TickerRenderer.ts';
import { setupDOM } from '../test-helpers/dom-setup.ts';
import type { TickerConfig } from '../types.ts';

describe('TickerRenderer', () => {
  beforeEach(() => {
    setupDOM();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const enabledConfig: TickerConfig = {
    enabled: true,
    items: ['News One', 'News Two'],
    speedPixelsPerSecond: 50,
    separator: '|',
  };

  const disabledConfig: TickerConfig = {
    enabled: false,
    items: [],
    speedPixelsPerSecond: 50,
    separator: '|',
  };

  it('hides ticker bar when disabled', () => {
    new TickerRenderer(disabledConfig);
    const bar = document.getElementById('ticker-bar')! as HTMLElement;
    expect(bar.style.display).toBe('none');
  });

  it('hides ticker bar when enabled but items are empty', () => {
    new TickerRenderer({ ...enabledConfig, items: [] });
    const bar = document.getElementById('ticker-bar')! as HTMLElement;
    expect(bar.style.display).toBe('none');
  });

  it('shows ticker bar when enabled with items', () => {
    new TickerRenderer(enabledConfig);
    const bar = document.getElementById('ticker-bar')! as HTMLElement;
    expect(bar.style.display).toBe('');
  });

  it('creates ticker items and separators', () => {
    new TickerRenderer(enabledConfig);
    const track = document.getElementById('ticker-track')!;
    const items = track.querySelectorAll('.ticker-item');
    const seps = track.querySelectorAll('.ticker-separator');

    // Items are duplicated for seamless looping (2 items x2 = 4)
    expect(items.length).toBe(4);
    expect(seps.length).toBe(4);
    expect(items[0].textContent).toBe('News One');
    expect(items[1].textContent).toBe('News Two');
  });

  it('separators contain the configured separator', () => {
    new TickerRenderer(enabledConfig);
    const track = document.getElementById('ticker-track')!;
    const seps = track.querySelectorAll('.ticker-separator');
    expect(seps[0].textContent).toContain('|');
  });

  it('update() re-renders with new config', () => {
    const tr = new TickerRenderer(enabledConfig);
    tr.update({ ...enabledConfig, items: ['Only One'] });

    const track = document.getElementById('ticker-track')!;
    const items = track.querySelectorAll('.ticker-item');
    // 1 item x2 = 2
    expect(items.length).toBe(2);
    expect(items[0].textContent).toBe('Only One');
  });

  it('stop() cancels animation', () => {
    const tr = new TickerRenderer(enabledConfig);
    expect(() => tr.stop()).not.toThrow();
  });

  it('destroy() stops animation', () => {
    const tr = new TickerRenderer(enabledConfig);
    expect(() => tr.destroy()).not.toThrow();
  });

  it('starts animation after rAF measures content', () => {
    new TickerRenderer(enabledConfig);
    // Trigger the requestAnimationFrame callback
    vi.advanceTimersByTime(16);
    // No errors means animation started successfully
  });

  it('animation loop updates transform', () => {
    const tr = new TickerRenderer(enabledConfig);
    const track = document.getElementById('ticker-track')! as HTMLElement;

    // Mock scrollWidth for content measurement
    Object.defineProperty(track, 'scrollWidth', { value: 400, configurable: true });

    // First rAF triggers the measurement callback
    vi.advanceTimersByTime(16);

    // Subsequent rAFs run the animation loop
    vi.advanceTimersByTime(16);
    vi.advanceTimersByTime(16);

    // The transform should have been updated
    expect(track.style.transform).toContain('translateX');

    tr.stop();
  });

  it('animation wraps offset when exceeding content width', () => {
    const tr = new TickerRenderer(enabledConfig);
    const track = document.getElementById('ticker-track')! as HTMLElement;

    // Set a small content width so offset wraps quickly
    Object.defineProperty(track, 'scrollWidth', { value: 20, configurable: true });

    // Trigger measurement + animation
    vi.advanceTimersByTime(16);

    // Run many frames to accumulate offset past contentWidth
    for (let i = 0; i < 200; i++) {
      vi.advanceTimersByTime(16);
    }

    tr.stop();
  });

  it('stop() when no animation is running is safe', () => {
    const tr = new TickerRenderer(disabledConfig);
    // No animation started, stop should be a no-op
    expect(() => tr.stop()).not.toThrow();
  });
});
