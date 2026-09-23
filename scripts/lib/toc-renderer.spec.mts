import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { renderStaticMath } from './static-math.mts';
import { addRenderedTocLabels, renderTableOfContents, slugifyHeading } from './toc-renderer.mts';

const POST_PATH = '/blog/example-post';
const renderToc = (html: string) => renderTableOfContents(html, POST_PATH);

test('slugifyHeading creates readable Unicode-safe fragments', () => {
  assert.equal(slugifyHeading('  Crème brûlée & 量子力学  '), 'creme-brulee-量子力学');
  assert.equal(slugifyHeading('हिन्दी भाषा'), 'हिन्दी-भाषा');
  assert.equal(slugifyHeading('がくせい'), 'がくせい');
  assert.equal(slugifyHeading('---'), '');
});

test('renderTableOfContents builds a heading hierarchy', () => {
  const result = renderToc(`
    <h2>Principle</h2>
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
  assert.equal(
    heading?.querySelector('.heading-permalink')?.getAttribute('href'),
    '/blog/example-post#principle',
  );
});

test('renderTableOfContents preserves explicit IDs and resolves every collision', () => {
  const result = renderToc(`
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
  const result = renderToc('<h3>Standalone subsection</h3>');

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
  const result = renderToc('<div id="section"></div><h2>Section</h2>');

  assert.equal(result.toc[0]?.id, 'section-1');
});

test('renderTableOfContents requires a root-relative article path', () => {
  assert.throws(
    () => renderTableOfContents('<h2>Section</h2>', ''),
    /postPath must be an absolute path/,
  );
});

test('TOC labels reuse rendered inline math and keep headings as plain accessible text', async () => {
  const source = String.raw`<h2>如果真的找到 <span class="math-inline">\(\mathcal{O}(nm)\)</span>，会发生什么？</h2><h3>先看 <span class="math-inline">\(x_i\)</span></h3>`;
  const { html, toc } = renderToc(source);
  const rendered = addRenderedTocLabels(await renderStaticMath(html), toc);
  const chapter = rendered[0];

  assert.equal(chapter?.text, String.raw`如果真的找到 \(\mathcal{O}(nm)\)，会发生什么？`);
  const label = new JSDOM(`<span>${chapter?.labelHtml ?? ''}</span>`).window.document;
  assert.equal(label.querySelectorAll('mjx-container[data-static-math]').length, 1);
  assert.equal(label.querySelectorAll('mjx-assistive-mml math').length, 1);
  assert.equal(chapter?.labelHtml?.includes('heading-permalink'), false);
  assert.match(chapter?.children[0]?.labelHtml ?? '', /data-static-math/);
  assert.equal(
    addRenderedTocLabels('<h2>Plain</h2>', renderToc('<h2>Plain</h2>').toc)[0]?.labelHtml,
    undefined,
  );
});
