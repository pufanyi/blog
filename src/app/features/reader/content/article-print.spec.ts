import { describe, expect, it } from 'vitest';
import { prepareArticlePrint } from './article-print';

describe('complete article printing', () => {
  it('opens nested disclosures for printing and restores the reader state', () => {
    const container = document.createElement('article');
    container.innerHTML =
      '<details open><summary>Open</summary></details><details><summary>Closed</summary><details><summary>Nested</summary>Text</details></details>';
    const cleanup = prepareArticlePrint(container);
    window.dispatchEvent(new Event('beforeprint'));
    expect(container.querySelectorAll('details[open]')).toHaveLength(3);
    window.dispatchEvent(new Event('beforeprint'));
    window.dispatchEvent(new Event('afterprint'));
    expect(container.querySelectorAll('details[open]')).toHaveLength(1);
    cleanup();
    window.dispatchEvent(new Event('beforeprint'));
    expect(container.querySelectorAll('details[open]')).toHaveLength(1);
  });
});
