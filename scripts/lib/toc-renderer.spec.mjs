import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { renderTableOfContents, slugifyHeading } from './toc-renderer.mjs';

test('slugifyHeading creates readable Unicode-safe fragments', () => {
  assert.equal(slugifyHeading('  Crème brûlée & 量子力学  '), 'creme-brulee-量子力学');
  assert.equal(slugifyHeading('हिन्दी भाषा'), 'हिन्दी-भाषा');
  assert.equal(slugifyHeading('がくせい'), 'がくせい');
  assert.equal(slugifyHeading('---'), '');
});

test('renderTableOfContents builds hierarchy and excludes heading controls', () => {
  const result = renderTableOfContents(`
    <h2>Principle <button class="ai-summary-button">AI Summary</button></h2>
    <h3>Derivation</h3>
    <h2>Examples</h2>
  `);

  assert.deepEqual(result.toc, [
    {
      id: 'principle',
      text: 'Principle',
      level: 2,
      children: [{ id: 'derivation', text: 'Derivation', level: 3, children: [] }],
    },
    { id: 'examples', text: 'Examples', level: 2, children: [] },
  ]);

  const { document } = new JSDOM(`<body>${result.html}</body>`).window;
  const heading = document.getElementById('principle');
  assert.equal(heading?.getAttribute('tabindex'), '-1');
  assert.equal(heading?.querySelector('.heading-permalink')?.getAttribute('href'), '#principle');
});

test('renderTableOfContents preserves explicit IDs and resolves every collision', () => {
  const result = renderTableOfContents(`
    <h2>Custom</h2>
    <h2 id="custom">Authored ID</h2>
    <h2>Custom</h2>
    <h2 id="custom">Duplicate authored ID</h2>
  `);

  assert.deepEqual(
    result.toc.map((item) => item.id),
    ['custom-1', 'custom', 'custom-2', 'custom-3'],
  );
});

test('renderTableOfContents keeps an orphan h3 navigable', () => {
  const result = renderTableOfContents('<h3>Standalone subsection</h3>');

  assert.deepEqual(result.toc, [
    {
      id: 'standalone-subsection',
      text: 'Standalone subsection',
      level: 3,
      children: [],
    },
  ]);
});

test('renderTableOfContents never collides with another element ID', () => {
  const result = renderTableOfContents('<div id="section"></div><h2>Section</h2>');

  assert.equal(result.toc[0]?.id, 'section-1');
});
