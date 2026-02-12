import type { FreeformPageConfig } from '../types.ts';

export function renderFreeform(config: FreeformPageConfig): HTMLElement {
  const container = document.createElement('div');

  if (config.title) {
    const title = document.createElement('div');
    title.className = 'page-title';
    title.textContent = config.title;
    container.appendChild(title);
  }

  const content = document.createElement('div');
  content.className = 'freeform-content';
  content.innerHTML = config.html;

  container.appendChild(content);
  return container;
}
