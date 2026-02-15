import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PresentationEngine } from './PresentationEngine.ts';
import { setupDOM } from '../test-helpers/dom-setup.ts';
import { createTestConfig } from '../test-helpers/fixtures.ts';

describe('PresentationEngine', () => {
  beforeEach(() => {
    setupDOM();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the first page into stage-a on start', () => {
    const config = createTestConfig();
    const engine = new PresentationEngine(config);
    engine.start();

    const stageA = document.getElementById('stage-a')!;
    expect(stageA.classList.contains('active')).toBe(true);
    expect(stageA.children.length).toBeGreaterThan(0);
  });

  it('stage-b is not active initially', () => {
    const config = createTestConfig();
    const engine = new PresentationEngine(config);
    engine.start();

    const stageB = document.getElementById('stage-b')!;
    expect(stageB.classList.contains('active')).toBe(false);
  });

  it('advances to next page after cycle duration', async () => {
    const config = createTestConfig({
      meta: { title: 'T', pageCycleDurationMs: 2000, transitionType: 'fade', transitionDurationMs: 100 },
      pages: [
        { type: 'data-grid', title: 'Page1', rows: [{ label: 'A', value: 'B' }] },
        { type: 'data-grid', title: 'Page2', rows: [{ label: 'C', value: 'D' }] },
      ],
    });

    const engine = new PresentationEngine(config);
    engine.start();

    // Advance past cycle + transition duration
    vi.advanceTimersByTime(2000);
    // Let transition complete
    vi.advanceTimersByTime(150);

    const stageB = document.getElementById('stage-b')!;
    expect(stageB.querySelector('.page-title')!.textContent).toBe('Page2');
  });

  it('stop() prevents further cycling', () => {
    const config = createTestConfig({
      meta: { title: 'T', pageCycleDurationMs: 1000, transitionType: 'fade', transitionDurationMs: 100 },
    });

    const engine = new PresentationEngine(config);
    engine.start();
    engine.stop();

    vi.advanceTimersByTime(5000);
    // Should not have advanced or thrown
  });

  it('updateConfig() restarts with new config', () => {
    const config = createTestConfig();
    const engine = new PresentationEngine(config);
    engine.start();

    const newConfig = createTestConfig({
      pages: [
        { type: 'data-grid', title: 'Updated', rows: [{ label: 'X', value: 'Y' }] },
      ],
    });
    engine.updateConfig(newConfig);

    const stageA = document.getElementById('stage-a')!;
    expect(stageA.querySelector('.page-title')!.textContent).toBe('Updated');
  });

  it('alternates between stage-a and stage-b', async () => {
    const config = createTestConfig({
      meta: { title: 'T', pageCycleDurationMs: 1000, transitionType: 'fade', transitionDurationMs: 100 },
      pages: [
        { type: 'data-grid', title: 'P1', rows: [{ label: 'A', value: '1' }] },
        { type: 'data-grid', title: 'P2', rows: [{ label: 'B', value: '2' }] },
        { type: 'data-grid', title: 'P3', rows: [{ label: 'C', value: '3' }] },
      ],
    });

    const engine = new PresentationEngine(config);
    engine.start();

    // First cycle: renders P2 into stage-b
    // Use async variant to properly flush microtasks (await in advancePage)
    await vi.advanceTimersByTimeAsync(1150);

    const stageB = document.getElementById('stage-b')!;
    expect(stageB.querySelector('.page-title')!.textContent).toBe('P2');

    // Second cycle: renders P3 into stage-a
    await vi.advanceTimersByTimeAsync(1150);

    const stageA = document.getElementById('stage-a')!;
    expect(stageA.querySelector('.page-title')!.textContent).toBe('P3');
  });
});
