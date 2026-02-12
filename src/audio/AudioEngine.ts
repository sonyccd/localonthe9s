import type { AudioConfig, AudioTrack } from '../types.ts';
import { Playlist } from './playlist.ts';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private playlist: Playlist;
  private config: AudioConfig;

  private currentSource: AudioBufferSourceNode | null = null;
  private currentGain: GainNode | null = null;
  private nextSource: AudioBufferSourceNode | null = null;
  private nextGain: GainNode | null = null;

  private masterOutput: GainNode | null = null;
  private exportDest: MediaStreamAudioDestinationNode | null = null;

  private playing = false;
  private muted = false;
  private crossfadeTimer: ReturnType<typeof setTimeout> | null = null;
  private volume: number;

  constructor(config: AudioConfig) {
    this.config = config;
    this.volume = config.volume;
    this.playlist = new Playlist(config.tracks, config.shuffle);
  }

  async init(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new AudioContext();

    // Master output bus — all sources route through here so we can tap it for export
    this.masterOutput = this.ctx.createGain();
    this.masterOutput.connect(this.ctx.destination);

    // Pre-fetch all tracks
    const fetches = this.config.tracks.map(t => this.loadTrack(t));
    await Promise.allSettled(fetches);
  }

  private async loadTrack(track: AudioTrack): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(track.url)) {
      return this.bufferCache.get(track.url)!;
    }

    try {
      const response = await fetch(track.url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
      this.bufferCache.set(track.url, audioBuffer);
      return audioBuffer;
    } catch {
      console.warn(`Failed to load audio track: ${track.name} (${track.url})`);
      return null;
    }
  }

  async play(): Promise<void> {
    if (!this.ctx || this.playing) return;

    const track = this.playlist.current();
    if (!track) return;

    const buffer = await this.loadTrack(track);
    if (!buffer) {
      // Try next track
      this.playlist.next();
      return this.play();
    }

    this.playing = true;
    this.playBuffer(buffer);
  }

  private playBuffer(buffer: AudioBuffer): void {
    if (!this.ctx) return;

    // Create source + gain chain
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.value = this.muted ? 0 : this.volume;

    source.connect(gain);
    gain.connect(this.masterOutput!);

    source.start(0);
    this.currentSource = source;
    this.currentGain = gain;

    // Schedule crossfade before track ends
    const trackDuration = buffer.duration;
    const crossfadeTime = Math.max(0, trackDuration - this.config.crossfadeDurationS);

    this.crossfadeTimer = setTimeout(() => {
      this.startCrossfade();
    }, crossfadeTime * 1000);

    // Fallback: when source ends naturally (in case crossfade fails)
    source.onended = () => {
      if (this.currentSource === source) {
        this.currentSource = null;
        this.currentGain = null;
      }
    };
  }

  private async startCrossfade(): Promise<void> {
    if (!this.ctx || !this.currentGain) return;

    const nextTrack = this.playlist.next();
    if (!nextTrack) return;

    const buffer = await this.loadTrack(nextTrack);
    if (!buffer) {
      // Skip unloadable tracks
      return this.startCrossfade();
    }

    const now = this.ctx.currentTime;
    const fadeDuration = this.config.crossfadeDurationS;

    // Fade out current
    this.currentGain.gain.linearRampToValueAtTime(
      this.muted ? 0 : this.volume,
      now,
    );
    this.currentGain.gain.linearRampToValueAtTime(0, now + fadeDuration);

    // Create and fade in next
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(
      this.muted ? 0 : this.volume,
      now + fadeDuration,
    );

    source.connect(gain);
    gain.connect(this.masterOutput!);
    source.start(0);

    this.nextSource = source;
    this.nextGain = gain;

    // After crossfade completes, swap references
    setTimeout(() => {
      // Stop old source
      try { this.currentSource?.stop(); } catch { /* already stopped */ }

      this.currentSource = this.nextSource;
      this.currentGain = this.nextGain;
      this.nextSource = null;
      this.nextGain = null;

      // Schedule next crossfade
      const trackDuration = buffer.duration;
      const crossfadeTime = Math.max(0, trackDuration - this.config.crossfadeDurationS - fadeDuration);

      this.crossfadeTimer = setTimeout(() => {
        this.startCrossfade();
      }, crossfadeTime * 1000);

      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
          this.currentGain = null;
        }
      };
    }, fadeDuration * 1000);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    const targetVolume = this.muted ? 0 : this.volume;

    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.currentGain) {
        this.currentGain.gain.linearRampToValueAtTime(targetVolume, now + 0.1);
      }
      if (this.nextGain) {
        this.nextGain.gain.linearRampToValueAtTime(targetVolume, now + 0.1);
      }
    }

    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  getVolume(): number {
    return this.volume;
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.muted) return;

    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.currentGain) {
        this.currentGain.gain.linearRampToValueAtTime(this.volume, now + 0.05);
      }
      if (this.nextGain) {
        this.nextGain.gain.linearRampToValueAtTime(this.volume, now + 0.05);
      }
    }
  }

  createExportStream(): MediaStream | null {
    if (!this.ctx || !this.masterOutput) return null;
    this.exportDest = this.ctx.createMediaStreamDestination();
    this.masterOutput.connect(this.exportDest);
    return this.exportDest.stream;
  }

  stopExportStream(): void {
    if (this.masterOutput && this.exportDest) {
      this.masterOutput.disconnect(this.exportDest);
      this.exportDest = null;
    }
  }

  stop(): void {
    this.playing = false;
    if (this.crossfadeTimer) {
      clearTimeout(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
    try { this.currentSource?.stop(); } catch { /* ok */ }
    try { this.nextSource?.stop(); } catch { /* ok */ }
    this.currentSource = null;
    this.currentGain = null;
    this.nextSource = null;
    this.nextGain = null;
  }

  update(config: AudioConfig): void {
    this.config = config;
    this.volume = config.volume;
    this.playlist.update(config.tracks, config.shuffle);
  }

  destroy(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.bufferCache.clear();
  }
}
