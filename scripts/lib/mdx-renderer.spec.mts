import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createHighlighter } from 'shiki';
import { renderMdx } from './mdx-renderer.mts';

test('renderMdx compiles native MDX while preserving post enhancements', async (t) => {
  const highlighter = await createHighlighter({
    themes: ['catppuccin-latte', 'catppuccin-mocha'],
    langs: ['js'],
  });
  t.after(() => highlighter.dispose());

  const source = `export const answer = 42

## Native MDX {answer}

<details>
<summary>Proof</summary>

Inline math $x_i$ [@example2026].

</details>

Collapsed years [@collapsed2025; @collapsed2026].

| A | B |
| - | - |
| 1 | 2 |

\`\`\`js
const value = 42;
\`\`\`

<FixtureDiagram />
`;

  const sourcePath = fileURLToPath(new URL('./fixtures/citation-post/index.mdx', import.meta.url));
  const result = await renderMdx(source, 'category/nested/example', sourcePath, highlighter);
  const { document } = new JSDOM(`<body>${result.html}</body>`).window;

  assert.equal(document.querySelector('h2')?.textContent, 'Native MDX 42');
  assert.equal(document.querySelector('details summary')?.textContent, 'Proof');
  assert.equal(document.querySelector('.math-inline')?.textContent, '\\(x_i\\)');
  assert.equal(
    document.querySelector('[id^="citation--"] a')?.getAttribute('href'),
    '/blog/category/nested/example#bib-example2026',
  );
  const collapsedCitation = document.querySelector(
    '[id^="citation--collapsed2025--collapsed2026--"]',
  );
  assert.equal(collapsedCitation?.textContent, '(Doe et al., 2025, 2026)');
  assert.deepEqual(
    Array.from(collapsedCitation?.querySelectorAll('a') ?? [], (anchor) => ({
      href: anchor.getAttribute('href'),
      text: anchor.textContent,
    })),
    [
      { href: '/blog/category/nested/example#bib-collapsed2025', text: '2025' },
      { href: '/blog/category/nested/example#bib-collapsed2026', text: '2026' },
    ],
  );
  assert.match(document.querySelector('#bib-example2026')?.textContent ?? '', /Example Reference/);
  const reference = document.querySelector<HTMLElement>('#bib-example2026');
  assert.equal(reference?.dataset['title'], 'Example Reference');
  assert.equal(reference?.dataset['authors'], 'Jane Doe');
  assert.equal(reference?.dataset['year'], '2026');
  assert.equal(
    document.querySelector('#bib-example2026 .citation-source-link')?.textContent,
    'example.com',
  );
  assert.equal(
    document.querySelector('#bib-example2026 .citation-source-link')?.getAttribute('href'),
    'https://example.com/papers/reference',
  );
  assert.ok(document.querySelector('.table-wrapper > table'));
  assert.equal(document.querySelector('.code-lang')?.textContent, 'js');
  assert.equal(
    document.querySelector('.fixture-post-component')?.textContent,
    'Discovered locally',
  );
  assert.equal(result.toc[0]?.text, 'Native MDX 42');
  const referencesHeading = document.querySelector('h2#references');
  assert.equal(document.querySelectorAll('h2#references').length, 1);
  assert.equal(referencesHeading?.textContent, 'References');
  assert.ok(referencesHeading?.nextElementSibling?.matches('#refs.references.csl-bib-body'));
  assert.equal(
    referencesHeading?.querySelector('.heading-permalink')?.getAttribute('href'),
    '/blog/category/nested/example#references',
  );
  assert.deepEqual(result.toc.at(-1), {
    id: 'references',
    text: 'References',
    level: 2,
    children: [],
  });
});

test('PDF embeds use isolated readers while preserving titles, sizes and download links', async (t) => {
  const highlighter = await createHighlighter({ themes: [], langs: [] });
  t.after(() => highlighter.dispose());
  const sourcePath = fileURLToPath(
    new URL('../../content/posts/example/index.mdx', import.meta.url),
  );
  const result = await renderMdx(
    `<iframe src="/posts/example/problem.pdf" title="题面 PDF" width="100%" height="800" />
<iframe src="/posts/example/solution.pdf" title="题解 PDF" height="600" />
<iframe src="https://example.com/video" title="Video" />

[查看题目 PDF](/posts/example/problem.pdf)`,
    'example',
    sourcePath,
    highlighter,
  );
  const { document } = new JSDOM(result.html).window;
  const frames = [...document.querySelectorAll('iframe')];
  assert.equal(frames[0]?.getAttribute('src'), '/pdf-viewer?file=%2Fposts%2Fexample%2Fproblem.pdf');
  assert.equal(
    frames[1]?.getAttribute('src'),
    '/pdf-viewer?file=%2Fposts%2Fexample%2Fsolution.pdf',
  );
  assert.equal(frames[0]?.title, '题面 PDF');
  assert.equal(frames[0]?.width, '100%');
  assert.equal(frames[0]?.height, '800');
  assert.equal(frames[1]?.height, '600');
  assert.equal(frames[0]?.getAttribute('loading'), 'lazy');
  assert.equal(document.querySelectorAll('.post-pdf').length, 2);
  assert.equal(frames[2]?.getAttribute('src'), 'https://example.com/video');
  assert.equal(document.querySelector('a')?.getAttribute('href'), '/posts/example/problem.pdf');
});
