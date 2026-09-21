import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { renderStaticMath } from './static-math.mts';

test('static math retains TeX, accessible MathML, disclosure content and SVG labels', async () => {
  const html = await renderStaticMath(
    String.raw`<p>Inline \(x^2\).</p><details><summary>Derivation</summary><div>\[\frac{a}{b}\]</div></details><svg viewBox="0 0 100 50"><foreignObject width="100" height="50"><div xmlns="http://www.w3.org/1999/xhtml">\(A^\top\)</div></foreignObject></svg>`,
  );
  const dom = new JSDOM(html);
  try {
    const document = dom.window.document;
    assert.equal(document.querySelectorAll('mjx-container[data-static-math]').length, 3);
    assert.equal(document.querySelectorAll('mjx-assistive-mml math').length, 3);
    assert.equal(document.querySelector('mjx-container')?.getAttribute('data-tex'), 'x^2');
    assert.equal(document.querySelector('mjx-container')?.hasAttribute('tabindex'), false);
    assert.equal(document.querySelector('mjx-container')?.hasAttribute('title'), false);
    assert.equal(document.querySelectorAll('details:not([open]) mjx-math').length, 1);
    assert.equal(document.querySelectorAll('svg foreignObject mjx-math').length, 1);
    assert.equal(document.querySelector('svg')?.getAttribute('viewBox'), '0 0 100 50');
    assert.match(document.querySelector('style')?.textContent ?? '', /\/assets\/mathjax\/woff2\//);
    assert.match(document.querySelector('style')?.textContent ?? '', /mjx-assistive-mml/);
    assert.equal(document.querySelectorAll('mjx-merror').length, 0);
  } finally {
    dom.window.close();
  }
});

test('article output is deterministic across intervening renders and concurrent callers', async () => {
  const source = String.raw`<p>\(x^2\)</p>`;
  const first = await renderStaticMath(source);
  const [, repeated] = await Promise.all([
    renderStaticMath(String.raw`<div>\[\int_0^\infty e^{-x}\,dx\]</div>`),
    renderStaticMath(source),
  ]);
  assert.equal(repeated, first);
  assert.equal(await renderStaticMath('<p>No formulas.</p>'), '<p>No formulas.</p>');
});

test('article-local macro definitions do not leak into other articles or cached rebuilds', async () => {
  const source = String.raw`<p>\(\articleOnlyMacro\)</p>`;
  const before = await renderStaticMath(source);
  await renderStaticMath(String.raw`<p>\(\newcommand{\articleOnlyMacro}{x}\articleOnlyMacro\)</p>`);
  assert.equal(await renderStaticMath(source), before);
});
