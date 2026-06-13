import { describe, expect, it } from 'vitest';
import { buildContentWithToc } from './toc-builder';

describe('buildContentWithToc', () => {
  it('excludes AI summary links from heading text', () => {
    const { toc } = buildContentWithToc(`
      <h2>The Principle of Least Action
        <button class="ai-summary-button" type="button">AI Summary</button>
      </h2>
    `);

    expect(toc).toEqual([
      {
        id: 'the-principle-of-least-action',
        text: 'The Principle of Least Action',
        level: 2,
      },
    ]);
  });
});
