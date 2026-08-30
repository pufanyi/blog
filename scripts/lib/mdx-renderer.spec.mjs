import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { createHighlighter } from 'shiki';
import { renderMdx } from '../build-posts.mjs';

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

Inline math $x_i$.

</details>

| A | B |
| - | - |
| 1 | 2 |

\`\`\`js
const value = 42;
\`\`\`
`;

  const result = await renderMdx(source, 'example', '/tmp/example/index.mdx', highlighter);
  const { document } = new JSDOM(`<body>${result.html}</body>`).window;

  assert.equal(document.querySelector('h2')?.textContent, 'Native MDX 42');
  assert.equal(document.querySelector('details summary')?.textContent, 'Proof');
  assert.equal(document.querySelector('.math-inline')?.textContent, '$x_i$');
  assert.ok(document.querySelector('.table-wrapper > table'));
  assert.equal(document.querySelector('.code-lang')?.textContent, 'js');
  assert.equal(result.toc[0]?.text, 'Native MDX 42');
});
