import type { TickerConfig } from '../types.ts';
import { TickerRenderer } from '../panels/TickerRenderer.ts';

export class TickerManager {
  private renderer: TickerRenderer;

  constructor(config: TickerConfig) {
    this.renderer = new TickerRenderer(config);
  }

  update(config: TickerConfig): void {
    this.renderer.update(config);
  }

  destroy(): void {
    this.renderer.destroy();
  }
}
