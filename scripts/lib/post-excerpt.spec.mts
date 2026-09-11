import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPostExcerpt } from './post-excerpt.mts';

test('excerpts use opening prose and preserve text without nested links or authored attributes', () => {
  assert.equal(
    buildPostExcerpt(
      '<h2>Introduction</h2><p>An <a href="/other">opening</a> with <strong>emphasis</strong> &amp; <code>code</code>.</p><p>Next paragraph.</p>',
    ),
    'An opening with emphasis &amp; code. Next paragraph.',
  );
});

test('excerpts skip media, code, diagrams, formulas, hidden notes and generated references', () => {
  assert.equal(
    buildPostExcerpt(
      '<figure><p>Caption</p><svg><text>Diagram</text></svg></figure><pre><code>code()</code></pre><table><tr><td><p>Data</p></td></tr></table><details><p>Note</p></details><p hidden>Hidden</p><p><img src="image.avif" /></p><div class="math-display">\\[x\\]</div><p>Actual opening.<sup data-footnote-ref>1</sup></p><section data-footnotes><p>Footnote</p></section><div class="csl-bib-body"><p>Reference</p></div>',
    ),
    'Actual opening.',
  );
  assert.equal(buildPostExcerpt('<iframe src="slides.pdf"></iframe><pre>code</pre>'), '');
});

test('excerpts keep inline math intact, including when a length limit falls inside a formula', () => {
  const formula = String.raw`\(x_i^2\)`;
  assert.equal(
    buildPostExcerpt(`<p>Let <span class="math-inline">${formula}</span> be positive.</p>`),
    `Let <span class="math-inline">${formula}</span> be positive.`,
  );
  assert.equal(buildPostExcerpt(`<p>Let ${formula} be positive.</p>`, 10), 'Let…');
});

test('excerpts truncate Chinese and English at word boundaries without splitting emoji', () => {
  assert.equal(buildPostExcerpt('<p>First opening sentence.</p>', 13), 'First opening…');
  assert.equal(buildPostExcerpt('<p>中文开头内容。</p>', 4), '中文开头…');
  assert.equal(buildPostExcerpt('<p>Hi 👩‍💻 reader.</p>', 5), 'Hi…');
  assert.equal(buildPostExcerpt('<p>Short.</p>', 6), 'Short.');
});
