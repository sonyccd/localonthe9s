import type { AudioTrack } from '../types.ts';

export class Playlist {
  private tracks: AudioTrack[];
  private currentIndex = 0;
  private shuffled = false;
  private order: number[] = [];

  constructor(tracks: AudioTrack[], shuffle: boolean) {
    this.tracks = tracks;
    this.shuffled = shuffle;
    this.buildOrder();
  }

  private buildOrder(): void {
    this.order = this.tracks.map((_, i) => i);
    if (this.shuffled) {
      // Fisher-Yates shuffle
      for (let i = this.order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.order[i], this.order[j]] = [this.order[j], this.order[i]];
      }
    }
    this.currentIndex = 0;
  }

  current(): AudioTrack | null {
    if (this.tracks.length === 0) return null;
    return this.tracks[this.order[this.currentIndex]];
  }

  next(): AudioTrack | null {
    if (this.tracks.length === 0) return null;
    this.currentIndex = (this.currentIndex + 1) % this.order.length;
    // Re-shuffle when we loop back
    if (this.currentIndex === 0 && this.shuffled) {
      this.buildOrder();
    }
    return this.current();
  }

  peek(): AudioTrack | null {
    if (this.tracks.length === 0) return null;
    const nextIndex = (this.currentIndex + 1) % this.order.length;
    return this.tracks[this.order[nextIndex]];
  }

  update(tracks: AudioTrack[], shuffle: boolean): void {
    this.tracks = tracks;
    this.shuffled = shuffle;
    this.buildOrder();
  }
}
