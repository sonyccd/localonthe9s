import type { AppConfig } from '../types.ts';
import { validateConfig, getDefaultConfig } from '../config/schema.ts';

const STORAGE_KEY = 'localonthe8s_config';

export type OnApplyCallback = (config: AppConfig) => void;

export class EditorUI {
  private overlay: HTMLElement;
  private textarea: HTMLTextAreaElement;
  private statusEl: HTMLElement;
  private fileInput: HTMLInputElement;
  private onApply: OnApplyCallback;
  private visible = false;

  constructor(onApply: OnApplyCallback) {
    this.overlay = document.getElementById('editor-overlay')!;
    this.textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    this.statusEl = document.getElementById('editor-status')!;
    this.fileInput = document.getElementById('editor-file-input') as HTMLInputElement;
    this.onApply = onApply;

    this.bindButtons();
  }

  private bindButtons(): void {
    document.getElementById('editor-close')!.addEventListener('click', () => this.hide());
    document.getElementById('editor-apply')!.addEventListener('click', () => this.apply());
    document.getElementById('editor-save')!.addEventListener('click', () => this.save());
    document.getElementById('editor-export')!.addEventListener('click', () => this.exportJSON());
    document.getElementById('editor-import')!.addEventListener('click', () => this.fileInput.click());
    document.getElementById('editor-reset')!.addEventListener('click', () => this.reset());

    this.fileInput.addEventListener('change', () => this.importJSON());
  }

  show(config: AppConfig): void {
    this.textarea.value = JSON.stringify(config, null, 2);
    this.statusEl.textContent = '';
    this.statusEl.className = '';
    this.overlay.classList.remove('hidden');
    this.visible = true;
    this.textarea.focus();
  }

  hide(): void {
    this.overlay.classList.add('hidden');
    this.visible = false;
  }

  toggle(config: AppConfig): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show(config);
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  private apply(): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.textarea.value);
    } catch (e) {
      this.setStatus(`JSON parse error: ${(e as Error).message}`, true);
      return;
    }

    const result = validateConfig(parsed);
    if (!result.valid) {
      this.setStatus(`Validation error: ${result.error}`, true);
      return;
    }

    this.onApply(result.config);
    this.setStatus('Applied successfully!', false);
  }

  private save(): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.textarea.value);
    } catch (e) {
      this.setStatus(`JSON parse error: ${(e as Error).message}`, true);
      return;
    }

    const result = validateConfig(parsed);
    if (!result.valid) {
      this.setStatus(`Validation error: ${result.error}`, true);
      return;
    }

    localStorage.setItem(STORAGE_KEY, this.textarea.value);
    this.onApply(result.config);
    this.setStatus('Saved to browser storage & applied!', false);
  }

  private exportJSON(): void {
    const blob = new Blob([this.textarea.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localonthe8s-config.json';
    a.click();
    URL.revokeObjectURL(url);
    this.setStatus('Exported JSON file', false);
  }

  private importJSON(): void {
    const file = this.fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.textarea.value = reader.result as string;
      this.setStatus(`Loaded ${file.name} — click Apply to use it`, false);
    };
    reader.readAsText(file);
    this.fileInput.value = '';
  }

  private reset(): void {
    const defaultConfig = getDefaultConfig();
    this.textarea.value = JSON.stringify(defaultConfig, null, 2);
    localStorage.removeItem(STORAGE_KEY);
    this.onApply(defaultConfig);
    this.setStatus('Reset to default config', false);
  }

  private setStatus(msg: string, isError: boolean): void {
    this.statusEl.textContent = msg;
    this.statusEl.className = isError ? 'error' : '';
  }

  static loadSavedConfig(): AppConfig | null {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    try {
      const parsed = JSON.parse(saved);
      const result = validateConfig(parsed);
      if (result.valid) return result.config;
    } catch { /* ignore invalid saved config */ }

    return null;
  }
}
