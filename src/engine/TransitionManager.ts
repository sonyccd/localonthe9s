import type { TransitionType } from '../types.ts';

export class TransitionManager {
  private transitionType: TransitionType = 'fade';
  private durationMs = 800;

  setTransition(type: TransitionType, durationMs: number): void {
    this.transitionType = type;
    this.durationMs = durationMs;
    document.documentElement.style.setProperty('--transition-duration', `${durationMs}ms`);
  }

  /**
   * Transitions from the outgoing stage to the incoming stage.
   * Returns a promise that resolves when the transition completes.
   */
  async transition(outgoing: HTMLElement, incoming: HTMLElement): Promise<void> {
    const type = this.transitionType;

    // Reset any leftover classes
    this.clearTransitionClasses(outgoing);
    this.clearTransitionClasses(incoming);

    // Set up initial states
    incoming.classList.add(`transition-${type}-enter`);
    outgoing.classList.add(`transition-${type}-exit`);

    // Force reflow so initial states apply before transition
    incoming.offsetHeight;

    return new Promise<void>((resolve) => {
      // Start transitions
      incoming.classList.add(`transition-${type}-enter-active`, 'active');
      incoming.classList.remove(`transition-${type}-enter`);
      outgoing.classList.add(`transition-${type}-exit-active`);
      outgoing.classList.remove(`transition-${type}-exit`, 'active');

      const cleanup = () => {
        this.clearTransitionClasses(outgoing);
        this.clearTransitionClasses(incoming);
        incoming.classList.add('active');
        outgoing.classList.remove('active');
        resolve();
      };

      setTimeout(cleanup, this.durationMs + 50);
    });
  }

  private clearTransitionClasses(el: HTMLElement): void {
    const classes = [...el.classList].filter(c => c.startsWith('transition-'));
    el.classList.remove(...classes);
  }
}
