import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EditorUI } from './EditorUI.ts';
import { setupDOM } from '../test-helpers/dom-setup.ts';
import { createTestConfig } from '../test-helpers/fixtures.ts';
import type { AppConfig } from '../types.ts';
import type { OnApplyCallback } from './EditorUI.ts';

describe('EditorUI', () => {
  let onApply: ReturnType<typeof vi.fn<OnApplyCallback>>;
  let editor: EditorUI;
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    setupDOM();
    onApply = vi.fn<OnApplyCallback>();
    editor = new EditorUI(onApply);

    // Mock localStorage
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, val: string) => { mockStorage[key] = val; }),
      removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
    });

    // Mock URL.createObjectURL/revokeObjectURL
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('show/hide/toggle', () => {
    it('show() makes the overlay visible and populates textarea', () => {
      const config = createTestConfig();
      editor.show(config);

      const overlay = document.getElementById('editor-overlay')!;
      expect(overlay.classList.contains('hidden')).toBe(false);
      expect(editor.isVisible()).toBe(true);

      const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toContain('"title"');
    });

    it('hide() adds hidden class', () => {
      editor.show(createTestConfig());
      editor.hide();

      const overlay = document.getElementById('editor-overlay')!;
      expect(overlay.classList.contains('hidden')).toBe(true);
      expect(editor.isVisible()).toBe(false);
    });

    it('toggle() shows when hidden', () => {
      editor.toggle(createTestConfig());
      expect(editor.isVisible()).toBe(true);
    });

    it('toggle() hides when visible', () => {
      editor.show(createTestConfig());
      editor.toggle(createTestConfig());
      expect(editor.isVisible()).toBe(false);
    });
  });

  describe('apply (via button click)', () => {
    it('calls onApply with valid config', () => {
      const config = createTestConfig();
      editor.show(config);

      document.getElementById('editor-apply')!.click();

      expect(onApply).toHaveBeenCalledTimes(1);
      const applied = onApply.mock.calls[0][0] as AppConfig;
      expect(applied.meta.title).toBe('Test');
    });

    it('shows success status on valid apply', () => {
      editor.show(createTestConfig());
      document.getElementById('editor-apply')!.click();

      const status = document.getElementById('editor-status')!;
      expect(status.textContent).toContain('Applied successfully');
      expect(status.className).toBe('');
    });

    it('shows error for invalid JSON', () => {
      editor.show(createTestConfig());
      const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
      textarea.value = '{broken json';

      document.getElementById('editor-apply')!.click();

      const status = document.getElementById('editor-status')!;
      expect(status.textContent).toContain('JSON parse error');
      expect(status.className).toBe('error');
      expect(onApply).not.toHaveBeenCalled();
    });

    it('shows error for invalid config structure', () => {
      editor.show(createTestConfig());
      const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
      textarea.value = '{"meta": "invalid"}';

      document.getElementById('editor-apply')!.click();

      const status = document.getElementById('editor-status')!;
      expect(status.textContent).toContain('Validation error');
      expect(status.className).toBe('error');
    });
  });

  describe('save (via button click)', () => {
    it('saves to localStorage and applies', () => {
      editor.show(createTestConfig());
      document.getElementById('editor-save')!.click();

      expect(localStorage.setItem).toHaveBeenCalled();
      expect(onApply).toHaveBeenCalledTimes(1);

      const status = document.getElementById('editor-status')!;
      expect(status.textContent).toContain('Saved');
    });

    it('shows error for invalid JSON on save', () => {
      editor.show(createTestConfig());
      const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
      textarea.value = 'not json';

      document.getElementById('editor-save')!.click();

      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(onApply).not.toHaveBeenCalled();
    });

    it('shows error for invalid config on save', () => {
      editor.show(createTestConfig());
      const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
      textarea.value = '{}';

      document.getElementById('editor-save')!.click();

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('reset (via button click)', () => {
    it('resets textarea to default config and removes from storage', () => {
      editor.show(createTestConfig());
      document.getElementById('editor-reset')!.click();

      expect(localStorage.removeItem).toHaveBeenCalledWith('localonthe8s_config');
      expect(onApply).toHaveBeenCalledTimes(1);

      const status = document.getElementById('editor-status')!;
      expect(status.textContent).toContain('Reset');
    });
  });

  describe('exportJSON (via button click)', () => {
    it('creates a download link', () => {
      editor.show(createTestConfig());

      // Spy on createElement to verify <a> element usage
      const clickSpy = vi.fn();
      const origCreate = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = origCreate(tag);
        if (tag === 'a') {
          el.click = clickSpy;
        }
        return el;
      });

      document.getElementById('editor-export')!.click();

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });

  describe('loadSavedConfig (static)', () => {
    it('returns null when nothing is saved', () => {
      expect(EditorUI.loadSavedConfig()).toBeNull();
    });

    it('returns config when valid JSON is saved', () => {
      const config = createTestConfig();
      mockStorage['localonthe8s_config'] = JSON.stringify(config);
      const loaded = EditorUI.loadSavedConfig();
      expect(loaded).not.toBeNull();
      expect(loaded!.meta.title).toBe('Test');
    });

    it('returns null for invalid saved JSON', () => {
      mockStorage['localonthe8s_config'] = 'not json';
      expect(EditorUI.loadSavedConfig()).toBeNull();
    });

    it('returns null for valid JSON but invalid config structure', () => {
      mockStorage['localonthe8s_config'] = '{"meta": "bad"}';
      expect(EditorUI.loadSavedConfig()).toBeNull();
    });
  });

  describe('exportVideo', () => {
    it('calls onExportVideo callback with valid config', async () => {
      const onExportVideo = vi.fn(async () => {});
      const editorWithVideo = new EditorUI(onApply, onExportVideo);
      editorWithVideo.show(createTestConfig());

      document.getElementById('editor-export-video')!.click();
      // Wait for async handler
      await vi.waitFor(() => {
        expect(onExportVideo).toHaveBeenCalledTimes(1);
      });
    });

    it('shows error for invalid JSON before export', () => {
      const onExportVideo = vi.fn(async () => {});
      const editorWithVideo = new EditorUI(onApply, onExportVideo);
      editorWithVideo.show(createTestConfig());

      const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
      textarea.value = 'bad json';
      document.getElementById('editor-export-video')!.click();

      expect(onExportVideo).not.toHaveBeenCalled();
      expect(document.getElementById('editor-status')!.textContent).toContain('JSON parse error');
    });

    it('does nothing when no onExportVideo callback', () => {
      editor.show(createTestConfig());
      // Should not throw
      document.getElementById('editor-export-video')!.click();
    });
  });
});
