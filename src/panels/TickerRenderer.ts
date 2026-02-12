import type { TickerConfig } from '../types.ts';

export class TickerRenderer {
  private trackEl: HTMLElement;
  private barEl: HTMLElement;
  private config: TickerConfig;
  private animationId: number | null = null;
  private offset = 0;
  private lastTimestamp = 0;
  private contentWidth = 0;

  constructor(config: TickerConfig) {
    this.trackEl = document.getElementById('ticker-track')!;
    this.barEl = document.getElementById('ticker-bar')!;
    this.config = config;
    this.render();
  }

  render(): void {
    this.stop();
    this.trackEl.innerHTML = '';

    if (!this.config.enabled || this.config.items.length === 0) {
      this.barEl.style.display = 'none';
      return;
    }

    this.barEl.style.display = '';

    // Build ticker content — duplicate for seamless loop
    const buildItems = (): DocumentFragment => {
      const frag = document.createDocumentFragment();
      for (const item of this.config.items) {
        const sep = document.createElement('span');
        sep.className = 'ticker-separator';
        sep.textContent = ` ${this.config.separator} `;
        frag.appendChild(sep);

        const span = document.createElement('span');
        span.className = 'ticker-item';
        span.textContent = item;
        frag.appendChild(span);
      }
      return frag;
    };

    // Add items twice for seamless looping
    this.trackEl.appendChild(buildItems());
    this.trackEl.appendChild(buildItems());

    // Measure after rendering
    requestAnimationFrame(() => {
      this.contentWidth = this.trackEl.scrollWidth / 2;
      this.offset = 0;
      this.lastTimestamp = 0;
      this.startAnimation();
    });
  }

  update(config: TickerConfig): void {
    this.config = config;
    this.render();
  }

  private startAnimation(): void {
    const animate = (timestamp: number) => {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const delta = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;

      this.offset += this.config.speedPixelsPerSecond * delta;

      if (this.offset >= this.contentWidth) {
        this.offset -= this.contentWidth;
      }

      this.trackEl.style.transform = `translateX(-${this.offset}px)`;
      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy(): void {
    this.stop();
  }
}
