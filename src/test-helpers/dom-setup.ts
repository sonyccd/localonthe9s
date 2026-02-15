/**
 * Injects the DOM skeleton matching index.html so that
 * getElementById-dependent modules resolve their elements.
 */
export function setupDOM(): void {
  document.body.innerHTML = `
    <div id="display">
      <div id="header">
        <div id="header-left">
          <div id="header-logo"></div>
          <div id="header-title"></div>
        </div>
        <div id="header-clock"></div>
      </div>

      <div id="stage-container">
        <div id="stage-a" class="stage"></div>
        <div id="stage-b" class="stage"></div>
      </div>

      <div id="ticker-bar">
        <div id="ticker-track"></div>
      </div>
    </div>

    <div id="editor-overlay" class="hidden">
      <div id="editor-panel">
        <div id="editor-header">
          <span>Configuration Editor</span>
          <button id="editor-close">&times;</button>
        </div>
        <textarea id="editor-textarea" spellcheck="false"></textarea>
        <div id="editor-status"></div>
        <div id="editor-actions">
          <button id="editor-apply">Apply</button>
          <button id="editor-save">Save to Browser</button>
          <button id="editor-export">Export JSON</button>
          <button id="editor-export-video">Export Video</button>
          <button id="editor-import">Import JSON</button>
          <button id="editor-reset">Reset to Default</button>
        </div>
        <input type="file" id="editor-file-input" accept=".json" class="hidden" />
      </div>
    </div>
  `;
}
