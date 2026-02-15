import type { AppConfig } from '../types.ts';

/** Creates a minimal valid AppConfig for tests. Override any field via spread. */
export function createTestConfig(overrides?: Partial<AppConfig>): AppConfig {
  return {
    meta: {
      title: 'Test',
      pageCycleDurationMs: 5000,
      transitionType: 'fade',
      transitionDurationMs: 300,
    },
    header: {
      title: 'Test Header',
      showClock: true,
      clockFormat: '12h',
    },
    pages: [
      {
        type: 'data-grid',
        title: 'Page 1',
        rows: [
          { label: 'Key', value: 'Val' },
        ],
      },
    ],
    ticker: {
      enabled: false,
      items: [],
      speedPixelsPerSecond: 50,
      separator: '|',
    },
    audio: {
      enabled: false,
      tracks: [],
      volume: 0.5,
      crossfadeDurationS: 3,
      shuffle: false,
      autoplay: false,
    },
    ...overrides,
  };
}
