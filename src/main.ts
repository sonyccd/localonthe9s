import './styles/reset.css';
import './styles/variables.css';
import './styles/fonts.css';
import './styles/base.css';
import './styles/header.css';
import './styles/panels.css';
import './styles/ticker.css';
import './styles/transitions.css';
import './styles/scanlines.css';
import './styles/editor.css';

import type { AppConfig } from './types.ts';
import { getDefaultConfig, applyTheme, resetTheme, validateConfig } from './config/schema.ts';
import { HeaderRenderer } from './panels/HeaderRenderer.ts';
import { PresentationEngine } from './engine/PresentationEngine.ts';
import { TickerManager } from './engine/TickerManager.ts';
import { AudioEngine } from './audio/AudioEngine.ts';
import { EditorUI } from './editor/EditorUI.ts';

let config: AppConfig;
let headerRenderer: HeaderRenderer;
let engine: PresentationEngine;
let tickerManager: TickerManager;
let audioEngine: AudioEngine;
let editorUI: EditorUI;
let cursorTimeout: ReturnType<typeof setTimeout> | null = null;
let volumeOsdTimeout: ReturnType<typeof setTimeout> | null = null;
const VOLUME_STEP = 0.05;
const VOLUME_BLOCKS = 20;

// ─── Config Loading ───

async function loadConfig(): Promise<AppConfig> {
  // Check URL param: ?config=filename.json
  const params = new URLSearchParams(window.location.search);
  const configFile = params.get('config');

  if (configFile) {
    try {
      const resp = await fetch(`/sample-configs/${configFile}`);
      if (resp.ok) {
        const json = await resp.json();
        const result = validateConfig(json);
        if (result.valid) return result.config;
      }
    } catch { /* fall through */ }
  }

  // Check localStorage
  const saved = EditorUI.loadSavedConfig();
  if (saved) return saved;

  // Default
  return getDefaultConfig();
}

// ─── Display Scaling ───

function scaleDisplay(): void {
  const display = document.getElementById('display')!;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const scaleX = vw / 640;
  const scaleY = vh / 480;
  const scale = Math.min(scaleX, scaleY);

  display.style.transform = `scale(${scale})`;
}

// ─── Cursor Auto-Hide ───

function resetCursorHide(): void {
  document.body.style.cursor = 'default';
  if (cursorTimeout) clearTimeout(cursorTimeout);
  cursorTimeout = setTimeout(() => {
    if (!editorUI?.isVisible()) {
      document.body.style.cursor = 'none';
    }
  }, 3000);
}

// ─── Hot Reload from Editor ───

function handleConfigUpdate(newConfig: AppConfig): void {
  config = newConfig;

  resetTheme();
  applyTheme(config.theme);

  headerRenderer.update(config.header);
  engine.updateConfig(config);
  tickerManager.update(config.ticker);
  audioEngine.update(config.audio);
}

// ─── Volume OSD ───

function showVolumeOSD(): void {
  const osd = document.getElementById('volume-osd')!;
  const bar = document.getElementById('volume-osd-bar')!;
  const label = document.getElementById('volume-osd-label')!;
  const value = document.getElementById('volume-osd-value')!;

  const vol = audioEngine.getVolume();
  const muted = audioEngine.isMuted();
  const filledCount = muted ? 0 : Math.round(vol * VOLUME_BLOCKS);
  const percent = muted ? 0 : Math.round(vol * 100);

  label.textContent = muted ? 'MUTE' : 'VOL';

  // Build blocks
  bar.innerHTML = '';
  for (let i = 0; i < VOLUME_BLOCKS; i++) {
    const block = document.createElement('div');
    block.className = i < filledCount ? 'volume-block' : 'volume-block off';
    bar.appendChild(block);
  }

  value.textContent = `${percent}`;

  // Show
  osd.classList.remove('volume-osd-hidden');

  // Auto-hide after 2s
  if (volumeOsdTimeout) clearTimeout(volumeOsdTimeout);
  volumeOsdTimeout = setTimeout(() => {
    osd.classList.add('volume-osd-hidden');
  }, 2000);
}

// ─── Keyboard Shortcuts ───

function handleKeyboard(e: KeyboardEvent): void {
  // Don't capture when editor textarea is focused
  if (editorUI?.isVisible() && e.target instanceof HTMLTextAreaElement) {
    if (e.key === 'Escape') {
      editorUI.hide();
      e.preventDefault();
    }
    return;
  }

  switch (e.key) {
    case 'e':
    case 'E':
      editorUI.toggle(config);
      e.preventDefault();
      break;
    case 'm':
    case 'M':
      audioEngine.toggleMute();
      showVolumeOSD();
      e.preventDefault();
      break;
    case 'ArrowUp':
      audioEngine.setVolume(audioEngine.getVolume() + VOLUME_STEP);
      showVolumeOSD();
      e.preventDefault();
      break;
    case 'ArrowDown':
      audioEngine.setVolume(audioEngine.getVolume() - VOLUME_STEP);
      showVolumeOSD();
      e.preventDefault();
      break;
    case 'Escape':
      if (editorUI.isVisible()) {
        editorUI.hide();
        e.preventDefault();
      }
      break;
    case 'F11':
      e.preventDefault();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      break;
  }
}

// ─── Startup ───

async function init(): Promise<void> {
  config = await loadConfig();

  // Apply theme
  applyTheme(config.theme);

  // Scale display
  scaleDisplay();
  window.addEventListener('resize', scaleDisplay);

  // Cursor auto-hide
  document.addEventListener('mousemove', resetCursorHide);
  resetCursorHide();

  // Initialize renderers
  headerRenderer = new HeaderRenderer(config.header);
  engine = new PresentationEngine(config);
  tickerManager = new TickerManager(config.ticker);
  audioEngine = new AudioEngine(config.audio);
  editorUI = new EditorUI(handleConfigUpdate);

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);

  // Start the presentation engine immediately (visuals don't need user gesture)
  engine.start();

  // Audio requires user gesture — startup overlay handles this
  const overlay = document.getElementById('startup-overlay')!;
  overlay.addEventListener('click', async () => {
    overlay.classList.add('hidden');

    if (config.audio.enabled && config.audio.autoplay) {
      await audioEngine.init();
      await audioEngine.play();
    }
  }, { once: true });
}

init();
