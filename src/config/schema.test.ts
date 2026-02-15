import { describe, it, expect, beforeEach } from 'vitest';
import { validateConfig, getDefaultConfig, applyTheme, resetTheme } from './schema.ts';
import { createTestConfig } from '../test-helpers/fixtures.ts';

describe('validateConfig', () => {
  it('rejects non-object values', () => {
    expect(validateConfig(null)).toEqual({ valid: false, error: 'Config must be a JSON object' });
    expect(validateConfig('string')).toEqual({ valid: false, error: 'Config must be a JSON object' });
    expect(validateConfig(42)).toEqual({ valid: false, error: 'Config must be a JSON object' });
  });

  it('rejects missing meta', () => {
    const result = validateConfig({});
    expect(result).toEqual({ valid: false, error: 'Missing or invalid "meta" section' });
  });

  it('rejects non-string meta.title', () => {
    const result = validateConfig({ meta: { title: 123 } });
    expect(result).toEqual({ valid: false, error: 'meta.title must be a string' });
  });

  it('rejects bad pageCycleDurationMs', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 500, transitionType: 'fade', transitionDurationMs: 0 },
    });
    expect(result).toEqual({ valid: false, error: 'meta.pageCycleDurationMs must be a number >= 1000' });
  });

  it('rejects invalid transitionType', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 5000, transitionType: 'bounce', transitionDurationMs: 0 },
    });
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toContain('meta.transitionType');
  });

  it('rejects negative transitionDurationMs', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 5000, transitionType: 'fade', transitionDurationMs: -1 },
    });
    expect(result.valid).toBe(false);
  });

  it('rejects missing header', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 5000, transitionType: 'fade', transitionDurationMs: 0 },
    });
    expect(result).toEqual({ valid: false, error: 'Missing or invalid "header" section' });
  });

  it('rejects non-string header.title', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 5000, transitionType: 'fade', transitionDurationMs: 0 },
      header: { title: 42 },
    });
    expect(result).toEqual({ valid: false, error: 'header.title must be a string' });
  });

  it('rejects empty pages array', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 5000, transitionType: 'fade', transitionDurationMs: 0 },
      header: { title: 'H' },
      pages: [],
    });
    expect(result).toEqual({ valid: false, error: '"pages" must be a non-empty array' });
  });

  it('rejects non-object page entry', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 5000, transitionType: 'fade', transitionDurationMs: 0 },
      header: { title: 'H' },
      pages: [null],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid page type', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 5000, transitionType: 'fade', transitionDurationMs: 0 },
      header: { title: 'H' },
      pages: [{ type: 'unknown' }],
    });
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toContain('pages[0].type');
  });

  it('validates data-grid requires rows array', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 5000, transitionType: 'fade', transitionDurationMs: 0 },
      header: { title: 'H' },
      pages: [{ type: 'data-grid' }],
      ticker: { enabled: false },
      audio: { enabled: false },
    });
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toContain('rows');
  });

  it('validates forecast requires cards array', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 5000, transitionType: 'fade', transitionDurationMs: 0 },
      header: { title: 'H' },
      pages: [{ type: 'forecast' }],
      ticker: { enabled: false },
      audio: { enabled: false },
    });
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toContain('cards');
  });

  it('validates table requires columns and rows', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 5000, transitionType: 'fade', transitionDurationMs: 0 },
      header: { title: 'H' },
      pages: [{ type: 'table' }],
      ticker: { enabled: false },
      audio: { enabled: false },
    });
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toContain('columns and rows');
  });

  it('validates freeform requires html string', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 5000, transitionType: 'fade', transitionDurationMs: 0 },
      header: { title: 'H' },
      pages: [{ type: 'freeform' }],
      ticker: { enabled: false },
      audio: { enabled: false },
    });
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toContain('html');
  });

  it('validates bar-chart requires bars array', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 5000, transitionType: 'fade', transitionDurationMs: 0 },
      header: { title: 'H' },
      pages: [{ type: 'bar-chart' }],
      ticker: { enabled: false },
      audio: { enabled: false },
    });
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toContain('bars');
  });

  it('rejects missing ticker', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 5000, transitionType: 'fade', transitionDurationMs: 0 },
      header: { title: 'H' },
      pages: [{ type: 'data-grid', rows: [] }],
    });
    expect(result).toEqual({ valid: false, error: 'Missing or invalid "ticker" section' });
  });

  it('rejects missing audio', () => {
    const result = validateConfig({
      meta: { title: 'T', pageCycleDurationMs: 5000, transitionType: 'fade', transitionDurationMs: 0 },
      header: { title: 'H' },
      pages: [{ type: 'data-grid', rows: [] }],
      ticker: { enabled: false },
    });
    expect(result).toEqual({ valid: false, error: 'Missing or invalid "audio" section' });
  });

  it('accepts a valid config', () => {
    const config = createTestConfig();
    const result = validateConfig(config);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.config.meta.title).toBe('Test');
    }
  });
});

describe('getDefaultConfig', () => {
  it('returns a deep clone of the sample config', () => {
    const a = getDefaultConfig();
    const b = getDefaultConfig();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.pages).not.toBe(b.pages);
  });
});

describe('applyTheme', () => {
  beforeEach(() => {
    // Clear any leftover inline styles
    document.documentElement.removeAttribute('style');
  });

  it('does nothing when theme is undefined', () => {
    applyTheme(undefined);
    expect(document.documentElement.style.length).toBe(0);
  });

  it('sets CSS custom properties for string values', () => {
    applyTheme({ labelColor: '#ff0000', valueColor: '#00ff00' });
    expect(document.documentElement.style.getPropertyValue('--label-color')).toBe('#ff0000');
    expect(document.documentElement.style.getPropertyValue('--value-color')).toBe('#00ff00');
  });

  it('sets scanlineOpacity as a string', () => {
    applyTheme({ scanlineOpacity: 0.3 });
    expect(document.documentElement.style.getPropertyValue('--scanline-opacity')).toBe('0.3');
  });
});

describe('resetTheme', () => {
  it('removes all theme CSS custom properties', () => {
    applyTheme({ labelColor: '#ff0000', scanlineOpacity: 0.5 });
    expect(document.documentElement.style.getPropertyValue('--label-color')).toBe('#ff0000');

    resetTheme();
    expect(document.documentElement.style.getPropertyValue('--label-color')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--scanline-opacity')).toBe('');
  });
});
