import type { AppConfig, PageConfig } from '../types.ts';
import { renderPage } from '../panels/PanelRenderer.ts';
import { TransitionManager } from './TransitionManager.ts';

export class PresentationEngine {
  private config: AppConfig;
  private stageA: HTMLElement;
  private stageB: HTMLElement;
  private activeStage: 'a' | 'b' = 'a';
  private currentPageIndex = 0;
  private cycleTimer: ReturnType<typeof setTimeout> | null = null;
  private transitionManager: TransitionManager;
  private running = false;
  private transitioning = false;

  constructor(config: AppConfig) {
    this.config = config;
    this.stageA = document.getElementById('stage-a')!;
    this.stageB = document.getElementById('stage-b')!;
    this.transitionManager = new TransitionManager();

    this.transitionManager.setTransition(
      config.meta.transitionType,
      config.meta.transitionDurationMs,
    );
  }

  start(): void {
    this.running = true;
    this.currentPageIndex = 0;

    // Render first page immediately on stage A
    this.renderToStage(this.stageA, this.config.pages[0]);
    this.stageA.classList.add('active');
    this.stageB.classList.remove('active');
    this.activeStage = 'a';

    this.scheduleCycle();
  }

  stop(): void {
    this.running = false;
    if (this.cycleTimer) {
      clearTimeout(this.cycleTimer);
      this.cycleTimer = null;
    }
  }

  updateConfig(config: AppConfig): void {
    this.stop();
    this.config = config;
    this.transitionManager.setTransition(
      config.meta.transitionType,
      config.meta.transitionDurationMs,
    );
    this.start();
  }

  private scheduleCycle(): void {
    if (!this.running) return;

    this.cycleTimer = setTimeout(() => {
      this.advancePage();
    }, this.config.meta.pageCycleDurationMs);
  }

  private async advancePage(): Promise<void> {
    if (!this.running || this.transitioning) return;
    this.transitioning = true;

    const nextIndex = (this.currentPageIndex + 1) % this.config.pages.length;
    const nextPage = this.config.pages[nextIndex];

    const outgoing = this.activeStage === 'a' ? this.stageA : this.stageB;
    const incoming = this.activeStage === 'a' ? this.stageB : this.stageA;

    // Render next page into the off-screen stage
    this.renderToStage(incoming, nextPage);

    // Perform the transition
    await this.transitionManager.transition(outgoing, incoming);

    // Swap active
    this.activeStage = this.activeStage === 'a' ? 'b' : 'a';
    this.currentPageIndex = nextIndex;
    this.transitioning = false;

    this.scheduleCycle();
  }

  private renderToStage(stage: HTMLElement, page: PageConfig): void {
    stage.innerHTML = '';
    const content = renderPage(page);
    stage.appendChild(content);
  }
}
