import { describe, it, expect } from 'vitest';
import { renderFreeform } from './FreeformPanel.ts';
import type { FreeformPageConfig } from '../types.ts';

describe('renderFreeform', () => {
  it('injects HTML content', () => {
    const config: FreeformPageConfig = {
      type: 'freeform',
      html: '<p>Hello <strong>world</strong></p>',
    };
    const el = renderFreeform(config);
    const content = el.querySelector('.freeform-content')!;
    expect(content.querySelector('p')).not.toBeNull();
    expect(content.querySelector('strong')!.textContent).toBe('world');
  });

  it('renders a title when provided', () => {
    const config: FreeformPageConfig = {
      type: 'freeform',
      title: 'Custom',
      html: '<span>hi</span>',
    };
    const el = renderFreeform(config);
    expect(el.querySelector('.page-title')!.textContent).toBe('Custom');
  });

  it('omits title when not provided', () => {
    const config: FreeformPageConfig = { type: 'freeform', html: '' };
    const el = renderFreeform(config);
    expect(el.querySelector('.page-title')).toBeNull();
  });

  it('handles empty HTML', () => {
    const config: FreeformPageConfig = { type: 'freeform', html: '' };
    const el = renderFreeform(config);
    const content = el.querySelector('.freeform-content')!;
    expect(content.innerHTML).toBe('');
  });
});
