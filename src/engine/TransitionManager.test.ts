import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TransitionManager } from './TransitionManager.ts';

describe('TransitionManager', () => {
  let tm: TransitionManager;
  let outgoing: HTMLElement;
  let incoming: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    tm = new TransitionManager();
    outgoing = document.createElement('div');
    outgoing.classList.add('active');
    incoming = document.createElement('div');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('setTransition sets the CSS custom property', () => {
    tm.setTransition('slide-left', 500);
    expect(document.documentElement.style.getPropertyValue('--transition-duration')).toBe('500ms');
  });

  it('transition adds enter-active class to incoming', async () => {
    tm.setTransition('fade', 200);
    const promise = tm.transition(outgoing, incoming);

    // After starting, incoming should have enter-active class
    expect(incoming.classList.contains('transition-fade-enter-active')).toBe(true);
    expect(incoming.classList.contains('active')).toBe(true);

    vi.advanceTimersByTime(250);
    await promise;
  });

  it('transition adds exit-active class to outgoing', async () => {
    tm.setTransition('fade', 200);
    const promise = tm.transition(outgoing, incoming);

    expect(outgoing.classList.contains('transition-fade-exit-active')).toBe(true);
    expect(outgoing.classList.contains('active')).toBe(false);

    vi.advanceTimersByTime(250);
    await promise;
  });

  it('cleanup removes transition classes and sets active correctly', async () => {
    tm.setTransition('fade', 200);
    const promise = tm.transition(outgoing, incoming);

    vi.advanceTimersByTime(250); // 200 + 50ms buffer
    await promise;

    expect(incoming.classList.contains('active')).toBe(true);
    expect(outgoing.classList.contains('active')).toBe(false);
    expect([...incoming.classList].filter(c => c.startsWith('transition-'))).toEqual([]);
    expect([...outgoing.classList].filter(c => c.startsWith('transition-'))).toEqual([]);
  });

  it('works with slide-left transition type', async () => {
    tm.setTransition('slide-left', 100);
    const promise = tm.transition(outgoing, incoming);

    expect(incoming.classList.contains('transition-slide-left-enter-active')).toBe(true);

    vi.advanceTimersByTime(150);
    await promise;

    expect(incoming.classList.contains('active')).toBe(true);
  });

  it('works with slide-up transition type', async () => {
    tm.setTransition('slide-up', 100);
    const promise = tm.transition(outgoing, incoming);

    expect(incoming.classList.contains('transition-slide-up-enter-active')).toBe(true);

    vi.advanceTimersByTime(150);
    await promise;
  });

  it('works with wipe transition type', async () => {
    tm.setTransition('wipe', 100);
    const promise = tm.transition(outgoing, incoming);

    expect(incoming.classList.contains('transition-wipe-enter-active')).toBe(true);

    vi.advanceTimersByTime(150);
    await promise;
  });

  it('clears leftover transition classes from previous transitions', async () => {
    tm.setTransition('fade', 100);

    // Simulate leftover classes
    outgoing.classList.add('transition-slide-left-enter-active');
    incoming.classList.add('transition-wipe-exit');

    const promise = tm.transition(outgoing, incoming);
    vi.advanceTimersByTime(150);
    await promise;

    // All transition- prefixed classes should be gone
    expect([...outgoing.classList].filter(c => c.startsWith('transition-'))).toEqual([]);
    expect([...incoming.classList].filter(c => c.startsWith('transition-'))).toEqual([]);
  });
});
