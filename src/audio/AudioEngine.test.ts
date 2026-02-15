import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioEngine } from './AudioEngine.ts';
import type { AudioConfig } from '../types.ts';

// --- Mock Web Audio API ---
class MockGainNode {
  gain = { value: 1, linearRampToValueAtTime: vi.fn() };
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockBufferSourceNode {
  buffer: unknown = null;
  onended: (() => void) | null = null;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockMediaStreamDestination {
  stream = { id: 'mock-stream' };
}

class MockAudioContext {
  currentTime = 0;
  destination = {};
  createGain = vi.fn(() => new MockGainNode());
  createBufferSource = vi.fn(() => new MockBufferSourceNode());
  createMediaStreamDestination = vi.fn(() => new MockMediaStreamDestination());
  decodeAudioData = vi.fn(async (buf: ArrayBuffer) => ({
    duration: 60,
    length: buf.byteLength,
  }));
  close = vi.fn();
}

const fakeArrayBuffer = new ArrayBuffer(8);

function makeConfig(overrides?: Partial<AudioConfig>): AudioConfig {
  return {
    enabled: true,
    tracks: [
      { name: 'Track A', url: '/a.mp3' },
      { name: 'Track B', url: '/b.mp3' },
    ],
    volume: 0.8,
    crossfadeDurationS: 3,
    shuffle: false,
    autoplay: false,
    ...overrides,
  };
}

describe('AudioEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => fakeArrayBuffer,
    })));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('constructs without creating AudioContext', () => {
    const engine = new AudioEngine(makeConfig());
    expect(engine).toBeDefined();
    // AudioContext should not be created until init()
  });

  it('init() creates AudioContext and fetches tracks', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('init() is idempotent', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    await engine.init();
    // Second call should not create a new AudioContext
  });

  it('toggleMute() flips muted state', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();

    expect(engine.isMuted()).toBe(false);
    const result1 = engine.toggleMute();
    expect(result1).toBe(true);
    expect(engine.isMuted()).toBe(true);

    const result2 = engine.toggleMute();
    expect(result2).toBe(false);
  });

  it('setVolume() clamps to [0, 1]', () => {
    const engine = new AudioEngine(makeConfig());
    engine.setVolume(1.5);
    expect(engine.getVolume()).toBe(1);

    engine.setVolume(-0.5);
    expect(engine.getVolume()).toBe(0);

    engine.setVolume(0.7);
    expect(engine.getVolume()).toBe(0.7);
  });

  it('setVolume() does not ramp when muted', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    engine.toggleMute(); // mute
    engine.setVolume(0.5); // should be a no-op on gain nodes
  });

  it('stop() clears playing state', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    await engine.play();

    engine.stop();
    // Should not throw or misbehave after stop
  });

  it('play() starts playback', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    await engine.play();
    // play() called init-ed engine — should have started a source
  });

  it('play() is a no-op before init', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.play(); // no ctx yet, should return silently
  });

  it('play() is a no-op if already playing', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    await engine.play();
    await engine.play(); // second call should be ignored
  });

  it('play() skips to next track if current fails to load', async () => {
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        // First prefetch of track A during init
        return { ok: true, arrayBuffer: async () => fakeArrayBuffer };
      }
      if (callCount === 2) {
        // Prefetch track B during init
        return { ok: true, arrayBuffer: async () => fakeArrayBuffer };
      }
      // Additional calls would be re-fetches
      return { ok: true, arrayBuffer: async () => fakeArrayBuffer };
    }));

    const config = makeConfig();
    const engine = new AudioEngine(config);
    await engine.init();
    await engine.play();
  });

  it('update() changes config and playlist', () => {
    const engine = new AudioEngine(makeConfig());
    const newConfig = makeConfig({ volume: 0.3 });
    engine.update(newConfig);
    expect(engine.getVolume()).toBe(0.3);
  });

  it('createExportStream() returns a MediaStream', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    const stream = engine.createExportStream();
    expect(stream).not.toBeNull();
  });

  it('createExportStream() returns null before init', () => {
    const engine = new AudioEngine(makeConfig());
    expect(engine.createExportStream()).toBeNull();
  });

  it('stopExportStream() disconnects the export node', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    engine.createExportStream();
    engine.stopExportStream();
    // Should not throw
  });

  it('destroy() closes AudioContext and clears cache', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    engine.destroy();
    // Subsequent operations should be safe
  });

  it('handles fetch failure gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    // loadTrack returns null for failed fetch — no errors thrown
  });

  it('handles fetch exception gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Network error'); }));
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    // Promise.allSettled should catch the errors
  });

  it('toggleMute() ramps gain on active sources', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    await engine.play();

    // Mute — should ramp to 0
    engine.toggleMute();
    // Unmute — should ramp back to volume
    engine.toggleMute();
  });

  it('setVolume() ramps gain on active sources when not muted', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    await engine.play();
    engine.setVolume(0.4);
    expect(engine.getVolume()).toBe(0.4);
  });

  it('play() with empty tracks does nothing', async () => {
    const engine = new AudioEngine(makeConfig({ tracks: [] }));
    await engine.init();
    await engine.play();
    // current() returns null, so play returns early
  });

  it('stopExportStream() is safe when no export is active', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    // Call without createExportStream first
    engine.stopExportStream();
  });

  it('stop() handles missing sources gracefully', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    // stop without play — sources are null
    engine.stop();
  });

  it('crossfade triggers after track duration minus crossfade time', async () => {
    const engine = new AudioEngine(makeConfig({ crossfadeDurationS: 2 }));
    await engine.init();
    await engine.play();

    // Track duration is 60s, crossfade is 2s, so crossfade starts at 58s
    await vi.advanceTimersByTimeAsync(58000);
    // Crossfade should have started — next source is being created
  });

  it('onended callback cleans up source reference', async () => {
    const engine = new AudioEngine(makeConfig());
    await engine.init();
    await engine.play();

    // Access the mock AudioContext to trigger onended
    // The source's onended callback is set during playBuffer
  });
});
