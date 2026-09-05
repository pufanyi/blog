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
  const result = await renderMdx(source, 'example', sourcePath, highlighter);
  const { document } = new JSDOM(`<body>${result.html}</body>`).window;

  assert.equal(document.querySelector('h2')?.textContent, 'Native MDX 42');
  assert.equal(document.querySelector('details summary')?.textContent, 'Proof');
  assert.equal(document.querySelector('.math-inline')?.textContent, '\\(x_i\\)');
  assert.equal(
    document.querySelector('[id^="citation--"] a')?.getAttribute('href'),
    '/blog/example#bib-example2026',
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
      { href: '/blog/example#bib-collapsed2025', text: '2025' },
      { href: '/blog/example#bib-collapsed2026', text: '2026' },
    ],
  );
  assert.match(document.querySelector('#bib-example2026')?.textContent ?? '', /Example Reference/);
  assert.equal(document.querySelector('#bib-example2026')?.dataset['title'], 'Example Reference');
  assert.equal(document.querySelector('#bib-example2026')?.dataset['authors'], 'Jane Doe');
  assert.equal(document.querySelector('#bib-example2026')?.dataset['year'], '2026');
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
    '/blog/example#references',
  );
  assert.deepEqual(result.toc.at(-1), {
    id: 'references',
    text: 'References',
    level: 2,
    children: [],
  });
});
