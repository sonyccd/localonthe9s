import type { HeaderConfig } from '../types.ts';

export class HeaderRenderer {
  private titleEl: HTMLElement;
  private clockEl: HTMLElement;
  private logoEl: HTMLElement;
  private clockInterval: ReturnType<typeof setInterval> | null = null;
  private config: HeaderConfig;

  constructor(config: HeaderConfig) {
    this.titleEl = document.getElementById('header-title')!;
    this.clockEl = document.getElementById('header-clock')!;
    this.logoEl = document.getElementById('header-logo')!;
    this.config = config;
    this.render();
  }

  render(): void {
    this.titleEl.textContent = this.config.title;

    // Update logo text — use innerHTML for <br> line breaks
    if (this.config.logoText) {
      this.logoEl.innerHTML = this.config.logoText.replace(/\n/g, '<br>');
    }

    if (this.config.showClock) {
      this.updateClock();
      this.clockInterval = setInterval(() => this.updateClock(), 1000);
    } else {
      this.clockEl.textContent = '';
      if (this.clockInterval) {
        clearInterval(this.clockInterval);
        this.clockInterval = null;
      }
    }
  }

  update(config: HeaderConfig): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
    this.config = config;
    this.render();
  }

  private updateClock(): void {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    let timeStr: string;
    if (this.config.clockFormat === '24h') {
      timeStr = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } else {
      timeStr = now.toLocaleTimeString('en-US', {
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      });
    }
    this.clockEl.innerHTML =
      `<div class="header-date">${dateStr}</div>` +
      `<div class="header-time">${timeStr}</div>`;
  }

  destroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }
}
