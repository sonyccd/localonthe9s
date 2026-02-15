import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Playlist } from './playlist.ts';
import type { AudioTrack } from '../types.ts';

const tracks: AudioTrack[] = [
  { name: 'A', url: '/a.mp3' },
  { name: 'B', url: '/b.mp3' },
  { name: 'C', url: '/c.mp3' },
];

describe('Playlist', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('sequential mode', () => {
    it('current() returns the first track', () => {
      const pl = new Playlist(tracks, false);
      expect(pl.current()!.name).toBe('A');
    });

    it('next() advances to the next track', () => {
      const pl = new Playlist(tracks, false);
      expect(pl.next()!.name).toBe('B');
      expect(pl.next()!.name).toBe('C');
    });

    it('wraps around after the last track', () => {
      const pl = new Playlist(tracks, false);
      pl.next(); // B
      pl.next(); // C
      expect(pl.next()!.name).toBe('A');
    });

    it('peek() returns the next track without advancing', () => {
      const pl = new Playlist(tracks, false);
      expect(pl.peek()!.name).toBe('B');
      expect(pl.current()!.name).toBe('A');
    });
  });

  describe('shuffle mode', () => {
    it('produces a deterministic order with seeded Math.random', () => {
      // Return values that produce a known permutation
      const randomValues = [0.5, 0.3];
      let callIndex = 0;
      vi.spyOn(Math, 'random').mockImplementation(() => randomValues[callIndex++] ?? 0);

      const pl = new Playlist(tracks, true);
      const order = [pl.current()!.name, pl.next()!.name, pl.next()!.name];
      // With 3 items, Fisher-Yates iterates i=2 then i=1:
      // i=2: j=floor(0.5*3)=1 → swap [2,1] → order: [0,2,1]
      // i=1: j=floor(0.3*2)=0 → swap [1,0] → order: [2,0,1]
      // So index order is [2,0,1] → tracks C, A, B
      expect(order).toEqual(['C', 'A', 'B']);
    });

    it('re-shuffles when wrapping around', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const pl = new Playlist(tracks, true);
      pl.next();
      pl.next();
      // The next call wraps → re-shuffle → buildOrder is called again
      const wrapped = pl.next();
      expect(wrapped).not.toBeNull();
    });
  });

  describe('empty tracks', () => {
    it('current() returns null', () => {
      const pl = new Playlist([], false);
      expect(pl.current()).toBeNull();
    });

    it('next() returns null', () => {
      const pl = new Playlist([], false);
      expect(pl.next()).toBeNull();
    });

    it('peek() returns null', () => {
      const pl = new Playlist([], false);
      expect(pl.peek()).toBeNull();
    });
  });

  describe('update()', () => {
    it('resets to new tracks', () => {
      const pl = new Playlist(tracks, false);
      pl.next(); // advance to B
      const newTracks: AudioTrack[] = [{ name: 'X', url: '/x.mp3' }];
      pl.update(newTracks, false);
      expect(pl.current()!.name).toBe('X');
    });
  });
});
