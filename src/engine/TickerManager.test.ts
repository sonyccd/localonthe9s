import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TickerManager } from './TickerManager.ts';
import { setupDOM } from '../test-helpers/dom-setup.ts';
import type { TickerConfig } from '../types.ts';

describe('TickerManager', () => {
  beforeEach(() => {
    setupDOM();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const config: TickerConfig = {
    enabled: true,
    items: ['Breaking News', 'Weather Alert'],
    speedPixelsPerSecond: 50,
    separator: '|',
  };

  it('constructs without error', () => {
    expect(() => new TickerManager(config)).not.toThrow();
  });

  it('update() delegates to renderer', () => {
    const tm = new TickerManager(config);
    const newConfig: TickerConfig = { ...config, items: ['Updated'] };
    expect(() => tm.update(newConfig)).not.toThrow();
  });

  it('destroy() delegates to renderer', () => {
    const tm = new TickerManager(config);
    expect(() => tm.destroy()).not.toThrow();
  });
});
