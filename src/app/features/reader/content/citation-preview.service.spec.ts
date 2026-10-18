import { TestBed } from '@angular/core/testing';
import { expect, it } from 'vitest';
import { CitationPreviewService } from './citation-preview.service';

it('unbinds citation listeners and disposes the open overlay without restoring retired focus', async () => {
  const service = TestBed.inject(CitationPreviewService);
  const container = document.createElement('div');
  container.innerHTML =
    '<span id="citation--example"><a href="#bib-example">Example</a></span><div class="csl-entry" id="bib-example" data-title="A reference">Reference body</div>';
  document.body.appendChild(container);
  const link = container.querySelector('a')!;
  const dispose = service.bind(container);
  try {
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await TestBed.tick();
    expect(document.querySelector('[aria-label="Citation preview"]')).not.toBeNull();
    dispose();
    await Promise.resolve();
    expect(document.querySelector('[aria-label="Citation preview"]')).toBeNull();
    const retiredClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(retiredClick);
    expect(retiredClick.defaultPrevented).toBe(false);
    expect(document.activeElement).not.toBe(link);
  } finally {
    dispose();
    container.remove();
  }
});
