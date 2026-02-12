export interface AppConfig {
  meta: MetaConfig;
  header: HeaderConfig;
  pages: PageConfig[];
  ticker: TickerConfig;
  audio: AudioConfig;
  theme?: ThemeConfig;
}

export interface MetaConfig {
  title: string;
  pageCycleDurationMs: number;
  transitionType: TransitionType;
  transitionDurationMs: number;
}

export type TransitionType = 'fade' | 'slide-left' | 'slide-up' | 'wipe';

export interface HeaderConfig {
  title: string;
  showClock: boolean;
  clockFormat: '12h' | '24h';
  logoUrl?: string;
  logoText?: string;
}

export type PageConfig =
  | DataGridPageConfig
  | ForecastPageConfig
  | TablePageConfig
  | FreeformPageConfig
  | BarChartPageConfig;

export interface BasePageConfig {
  title?: string;
}

export interface DataGridPageConfig extends BasePageConfig {
  type: 'data-grid';
  rows: DataGridRow[];
}

export interface DataGridRow {
  label: string;
  value: string;
}

export interface ForecastPageConfig extends BasePageConfig {
  type: 'forecast';
  cards: ForecastCard[];
}

export interface ForecastCard {
  label: string;
  icon?: string;
  primary: string;
  secondary?: string;
}

export interface TablePageConfig extends BasePageConfig {
  type: 'table';
  columns: string[];
  rows: string[][];
}

export interface FreeformPageConfig extends BasePageConfig {
  type: 'freeform';
  html: string;
}

export interface BarChartPageConfig extends BasePageConfig {
  type: 'bar-chart';
  bars: BarChartBar[];
  maxValue?: number;
  unit?: string;
}

export interface BarChartBar {
  label: string;
  value: number;
  color?: string;
}

export interface TickerConfig {
  enabled: boolean;
  items: string[];
  speedPixelsPerSecond: number;
  separator: string;
}

export interface AudioConfig {
  enabled: boolean;
  tracks: AudioTrack[];
  volume: number;
  crossfadeDurationS: number;
  shuffle: boolean;
  autoplay: boolean;
}

export interface AudioTrack {
  name: string;
  url: string;
}

export interface ExportProgress {
  phase: 'preparing' | 'recording' | 'encoding' | 'done' | 'error';
  currentPage: number;
  totalPages: number;
  errorMessage?: string;
}

export interface ThemeConfig {
  backgroundGradient1?: string;
  backgroundGradient2?: string;
  headerBackground?: string;
  tickerBackground?: string;
  labelColor?: string;
  valueColor?: string;
  headerColor?: string;
  accentColor?: string;
  tickerTextColor?: string;
  scanlineOpacity?: number;
  fontPrimary?: string;
  fontSecondary?: string;
}
