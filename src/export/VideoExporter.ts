import type { AppConfig, ExportProgress } from '../types.ts';
import { renderPage } from '../panels/PanelRenderer.ts';
import { TransitionManager } from '../engine/TransitionManager.ts';

export interface ExportCallbacks {
  onBeforeExport: () => void;
  onAfterExport: () => void;
}

export class VideoExporter {
  private config: AppConfig;
  private cancelled = false;
  private overlay: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private progressText: HTMLElement | null = null;
  private phaseText: HTMLElement | null = null;

  constructor(config: AppConfig) {
    this.config = config;
  }

  async export(callbacks: ExportCallbacks, audioStream?: MediaStream | null): Promise<void> {
    this.cancelled = false;

    // Dynamically import html2canvas to keep it out of main bundle
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default;

    const display = document.getElementById('display')!;
    const stageA = document.getElementById('stage-a')!;
    const stageB = document.getElementById('stage-b')!;
    const pages = this.config.pages;
    const totalPages = pages.length;

    if (totalPages === 0) {
      throw new Error('No pages to export');
    }

    // Create progress overlay
    this.createOverlay(totalPages);
    this.updateProgress({ phase: 'preparing', currentPage: 0, totalPages });

    // Stop the running engine
    callbacks.onBeforeExport();

    // Strip viewport scaling transform so html2canvas sees native 640x480 layout.
    // CSS transform: scale() doesn't affect DOM layout, which confuses html2canvas's
    // coordinate calculations — content ends up tiny and offset.
    const savedTransform = display.style.transform;
    display.style.transform = 'none';

    // Add export-active class to force CSS animation final states.
    // html2canvas can't process @keyframes — without this, bar charts
    // stay at scaleY(0) and values stay at opacity 0.
    display.classList.add('export-active');

    // Set up the recording canvas
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d')!;

    // Set up MediaRecorder — merge video stream with audio if available
    const videoStream = canvas.captureStream(30);
    const stream = new MediaStream(videoStream.getVideoTracks());
    if (audioStream) {
      for (const track of audioStream.getAudioTracks()) {
        stream.addTrack(track);
      }
    }
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find(t => MediaRecorder.isTypeSupported(t));

    if (!mimeType) {
      this.removeOverlay();
      callbacks.onAfterExport();
      throw new Error('No supported video codec found in this browser');
    }

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    // Create a dedicated TransitionManager for export
    const transitionManager = new TransitionManager();
    transitionManager.setTransition(
      this.config.meta.transitionType,
      this.config.meta.transitionDurationMs,
    );

    const pageDuration = this.config.meta.pageCycleDurationMs;
    const transitionDuration = this.config.meta.transitionDurationMs;

    // Elements to ignore when capturing
    const ignoreIds = new Set([
      'editor-overlay', 'startup-overlay', 'volume-osd', 'export-progress-overlay',
    ]);

    const captureFrame = async (): Promise<void> => {
      const capturedCanvas = await html2canvas(display, {
        width: 640,
        height: 480,
        scale: 1,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        ignoreElements: (el: Element) => ignoreIds.has(el.id),
      });
      ctx.clearRect(0, 0, 640, 480);
      ctx.drawImage(capturedCanvas, 0, 0);
    };

    /**
     * Captures frames in a loop for the given duration (ms).
     * html2canvas is async and varies in speed, so we capture as fast as possible.
     * captureStream(30) repeats the last frame to fill 30fps.
     */
    const captureForDuration = async (durationMs: number): Promise<void> => {
      const start = performance.now();
      while (performance.now() - start < durationMs) {
        if (this.cancelled) return;
        await captureFrame();
      }
    };

    try {
      recorder.start();
      this.updateProgress({ phase: 'recording', currentPage: 1, totalPages });

      // Render first page to stage A
      let activeStage: 'a' | 'b' = 'a';
      stageA.innerHTML = '';
      stageA.appendChild(renderPage(pages[0]));
      stageA.classList.add('active');
      stageB.classList.remove('active');

      // Capture first page static hold
      await captureForDuration(pageDuration);

      // Loop through remaining pages with transitions
      for (let i = 1; i < totalPages; i++) {
        if (this.cancelled) break;

        this.updateProgress({ phase: 'recording', currentPage: i + 1, totalPages });

        const outgoing = activeStage === 'a' ? stageA : stageB;
        const incoming = activeStage === 'a' ? stageB : stageA;

        // Render next page into incoming stage
        incoming.innerHTML = '';
        incoming.appendChild(renderPage(pages[i]));

        // Start transition (non-blocking — we capture during it)
        const transitionPromise = transitionManager.transition(outgoing, incoming);

        // Capture frames during transition
        await captureForDuration(transitionDuration);

        // Ensure transition completes
        await transitionPromise;

        // Swap active stage
        activeStage = activeStage === 'a' ? 'b' : 'a';

        if (this.cancelled) break;

        // Capture static hold for this page
        await captureForDuration(pageDuration);
      }

      if (this.cancelled) {
        recorder.stop();
        display.style.transform = savedTransform;
        display.classList.remove('export-active');
        this.removeOverlay();
        callbacks.onAfterExport();
        return;
      }

      // Finish recording
      this.updateProgress({ phase: 'encoding', currentPage: totalPages, totalPages });

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      // Download the video
      const blob = new Blob(chunks, { type: mimeType });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `localonthe8s-${timestamp}.webm`;
      a.click();
      URL.revokeObjectURL(url);

      this.updateProgress({ phase: 'done', currentPage: totalPages, totalPages });

      // Brief pause so user sees "COMPLETE"
      await this.sleep(1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.updateProgress({ phase: 'error', currentPage: 0, totalPages, errorMessage: msg });
      await this.sleep(3000);
    } finally {
      display.style.transform = savedTransform;
      display.classList.remove('export-active');
      this.removeOverlay();
      callbacks.onAfterExport();
    }
  }

  cancel(): void {
    this.cancelled = true;
  }

  private createOverlay(totalPages: number): void {
    const overlay = document.createElement('div');
    overlay.id = 'export-progress-overlay';

    overlay.innerHTML = `
      <div class="export-progress-box">
        <div class="export-progress-title">EXPORTING VIDEO</div>
        <div class="export-progress-phase" id="export-phase">PREPARING...</div>
        <div class="export-progress-bar-track">
          <div class="export-progress-bar-fill" id="export-bar"></div>
        </div>
        <div class="export-progress-info" id="export-info">Page 0 of ${totalPages}</div>
        <button class="export-cancel-btn" id="export-cancel">CANCEL</button>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.progressBar = document.getElementById('export-bar');
    this.progressText = document.getElementById('export-info');
    this.phaseText = document.getElementById('export-phase');

    document.getElementById('export-cancel')!.addEventListener('click', () => this.cancel());
  }

  private removeOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  private updateProgress(progress: ExportProgress): void {
    if (!this.phaseText || !this.progressText || !this.progressBar) return;

    const phaseLabels: Record<ExportProgress['phase'], string> = {
      preparing: 'PREPARING...',
      recording: 'RECORDING',
      encoding: 'ENCODING VIDEO...',
      done: 'EXPORT COMPLETE',
      error: 'ERROR',
    };

    this.phaseText.textContent = phaseLabels[progress.phase];

    if (progress.phase === 'recording') {
      this.progressText.textContent = `Page ${progress.currentPage} of ${progress.totalPages}`;
      const pct = (progress.currentPage / progress.totalPages) * 100;
      this.progressBar.style.width = `${pct}%`;
    } else if (progress.phase === 'encoding') {
      this.progressText.textContent = 'Finalizing...';
      this.progressBar.style.width = '100%';
    } else if (progress.phase === 'done') {
      this.progressText.textContent = 'Download started!';
      this.progressBar.style.width = '100%';
    } else if (progress.phase === 'error') {
      this.progressText.textContent = progress.errorMessage || 'Unknown error';
      this.progressBar.style.width = '0%';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
