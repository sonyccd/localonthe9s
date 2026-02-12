import type { AppConfig, ThemeConfig } from '../types.ts';
import { sampleWeatherConfig } from './sample-weather.ts';

const VALID_TRANSITION_TYPES = ['fade', 'slide-left', 'slide-up', 'wipe'] as const;
const VALID_PAGE_TYPES = ['data-grid', 'forecast', 'table', 'freeform', 'bar-chart'] as const;

export function getDefaultConfig(): AppConfig {
  return structuredClone(sampleWeatherConfig);
}

export function validateConfig(raw: unknown): { valid: true; config: AppConfig } | { valid: false; error: string } {
  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, error: 'Config must be a JSON object' };
  }

  const obj = raw as Record<string, unknown>;

  // Validate meta
  if (!obj.meta || typeof obj.meta !== 'object') {
    return { valid: false, error: 'Missing or invalid "meta" section' };
  }
  const meta = obj.meta as Record<string, unknown>;
  if (typeof meta.title !== 'string') {
    return { valid: false, error: 'meta.title must be a string' };
  }
  if (typeof meta.pageCycleDurationMs !== 'number' || meta.pageCycleDurationMs < 1000) {
    return { valid: false, error: 'meta.pageCycleDurationMs must be a number >= 1000' };
  }
  if (!VALID_TRANSITION_TYPES.includes(meta.transitionType as typeof VALID_TRANSITION_TYPES[number])) {
    return { valid: false, error: `meta.transitionType must be one of: ${VALID_TRANSITION_TYPES.join(', ')}` };
  }
  if (typeof meta.transitionDurationMs !== 'number' || meta.transitionDurationMs < 0) {
    return { valid: false, error: 'meta.transitionDurationMs must be a non-negative number' };
  }

  // Validate header
  if (!obj.header || typeof obj.header !== 'object') {
    return { valid: false, error: 'Missing or invalid "header" section' };
  }
  const header = obj.header as Record<string, unknown>;
  if (typeof header.title !== 'string') {
    return { valid: false, error: 'header.title must be a string' };
  }

  // Validate pages
  if (!Array.isArray(obj.pages) || obj.pages.length === 0) {
    return { valid: false, error: '"pages" must be a non-empty array' };
  }
  for (let i = 0; i < obj.pages.length; i++) {
    const page = obj.pages[i] as Record<string, unknown>;
    if (!page || typeof page !== 'object') {
      return { valid: false, error: `pages[${i}] must be an object` };
    }
    if (!VALID_PAGE_TYPES.includes(page.type as typeof VALID_PAGE_TYPES[number])) {
      return { valid: false, error: `pages[${i}].type must be one of: ${VALID_PAGE_TYPES.join(', ')}` };
    }

    switch (page.type) {
      case 'data-grid':
        if (!Array.isArray(page.rows)) {
          return { valid: false, error: `pages[${i}].rows must be an array` };
        }
        break;
      case 'forecast':
        if (!Array.isArray(page.cards)) {
          return { valid: false, error: `pages[${i}].cards must be an array` };
        }
        break;
      case 'table':
        if (!Array.isArray(page.columns) || !Array.isArray(page.rows)) {
          return { valid: false, error: `pages[${i}] requires columns and rows arrays` };
        }
        break;
      case 'freeform':
        if (typeof page.html !== 'string') {
          return { valid: false, error: `pages[${i}].html must be a string` };
        }
        break;
      case 'bar-chart':
        if (!Array.isArray(page.bars)) {
          return { valid: false, error: `pages[${i}].bars must be an array` };
        }
        break;
    }
  }

  // Validate ticker
  if (!obj.ticker || typeof obj.ticker !== 'object') {
    return { valid: false, error: 'Missing or invalid "ticker" section' };
  }

  // Validate audio
  if (!obj.audio || typeof obj.audio !== 'object') {
    return { valid: false, error: 'Missing or invalid "audio" section' };
  }

  return { valid: true, config: obj as unknown as AppConfig };
}

export function applyTheme(theme?: ThemeConfig): void {
  const root = document.documentElement;

  if (!theme) return;

  const mapping: Record<string, string> = {
    backgroundGradient1: '--bg-gradient-1',
    backgroundGradient2: '--bg-gradient-2',
    backgroundGradient3: '--bg-gradient-3',
    backgroundGradient4: '--bg-gradient-4',
    headerBackground: '--header-bg',
    tickerBackground: '--ticker-bg',
    labelColor: '--label-color',
    valueColor: '--value-color',
    headerColor: '--header-color',
    accentColor: '--accent-1',
    tickerTextColor: '--ticker-text',
    fontPrimary: '--font-primary',
    fontSecondary: '--font-secondary',
  };

  for (const [key, cssVar] of Object.entries(mapping)) {
    const val = theme[key as keyof ThemeConfig];
    if (val !== undefined && typeof val === 'string') {
      root.style.setProperty(cssVar, val);
    }
  }

  if (theme.scanlineOpacity !== undefined) {
    root.style.setProperty('--scanline-opacity', String(theme.scanlineOpacity));
  }
}

export function resetTheme(): void {
  const root = document.documentElement;
  const props = [
    '--bg-gradient-1', '--bg-gradient-2', '--bg-gradient-3', '--bg-gradient-4',
    '--header-bg', '--ticker-bg',
    '--label-color', '--value-color', '--header-color', '--accent-1',
    '--ticker-text', '--font-primary', '--font-secondary', '--scanline-opacity',
  ];
  for (const prop of props) {
    root.style.removeProperty(prop);
  }
}
