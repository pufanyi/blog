import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { Marked, type Tokens } from 'marked';
import { createHighlighter } from 'shiki';
import type { CvData } from '../../src/app/models/cv.model';
import {
  type AgentPost,
  buildAgentFiles,
  renderProfileMarkdown,
  writeAgentFiles,
} from './agent-content.mts';
import { htmlToAgentMarkdown } from './agent-markdown.mts';
import { renderCvMarkdown } from './cv-markdown.mts';
import { renderMdx } from './mdx-renderer.mts';
import { loadSiteConfiguration } from './site-config.mts';

const site = loadSiteConfiguration(fileURLToPath(new URL('../../configs', import.meta.url))).site;
const cv: CvData = {
  header: {
    name: 'Example 中文',
    photo: '/me.avif',
    affiliation: ['University'],
    contact: [{ icon: 'mail', text: 'user@example.com', href: 'mailto:user@example.com' }],
    links: [{ icon: 'blog', label: 'Blog', href: '/blog' }],
  },
  abstract: { paragraphs: ['Research on **models**. [Project](/project).'], keywords: ['AI'] },
  sections: [
    {
      title: 'Research',
      content: 'Authored <em>HTML</em>.',
      entries: [
        {
          title: 'Literal * title',
          date: '2025–2026',
          location: 'Singapore',
          detail: 'A **paper**.',
          links: [{ text: 'Paper', href: '/paper.pdf' }],
          items: ['A [result](https://example.com/result).'],
        },
      ],
      subsections: [{ title: 'Service', items: ['Reviewer'] }],
    },
  ],
};

test('Markdown export preserves expanded MDX, code, math, tables, footnotes and APA citations', async (t) => {
  const highlighter = await createHighlighter({
    themes: ['catppuccin-latte', 'catppuccin-mocha'],
    langs: ['js'],
  });
  t.after(() => highlighter.dispose());
  const code =
    'const marker = "```"; // [!code highlight]\nconst tex = String.raw`\\(x_i\\)`;\n\n  // trailing spaces  \n\n';
  const source =
    String.raw`export const answer = 42

## Example {answer}

中文 $x_i$ 后文 and $\alpha + \beta$ text.

$$
\begin{aligned}
y &= x^2 \\
z &= \frac{1}{2}
\end{aligned}
$$

<details>
<summary>Proof</summary>

Proof with [@example2026] and [@collapsed2025; @collapsed2026]. Note[^note].

</details>

| A | B |
| - | - |
| $x_i$ | **bold** |

![Example image](./image.avif)

[Section](#example-42) and [download](/posts/example/code.zip).

<FixtureDiagram />

<iframe src="/posts/example/problem.pdf" title="Problem PDF" />

[^note]: Footnote with [source](https://example.com/note).
` + `\n\n\`\`\`\`js\n${code}\n\`\`\`\`\n`;
  const sourcePath = fileURLToPath(new URL('./fixtures/citation-post/index.mdx', import.meta.url));
  const rendered = await renderMdx(source, 'example', sourcePath, highlighter);
  const result = htmlToAgentMarkdown(rendered.markdownHtml, `${site.url}/blog/example`);
  assert.match(result, /## Example 42/);
  assert.ok(result.includes('中文 $x_i$ 后文 and $\\alpha + \\beta$ text.'));
  assert.ok(
    result.includes('$$\n\\begin{aligned}\ny &= x^2 \\\\\nz &= \\frac{1}{2}\n\\end{aligned}\n$$'),
  );
  const codes = new Marked()
    .lexer(result)
    .filter((token): token is Tokens.Code => token.type === 'code');
  assert.equal(codes.length, 1);
  assert.equal(codes[0]?.lang, 'js');
  assert.equal(codes[0]?.text, code);
  assert.match(result, /\| \$x_i\$/);
  assert.match(result, /Proof/);
  assert.match(result, /Footnote with \[source\]\(https:\/\/example.com\/note\)/);
  assert.match(result, /#user-content-fn-note/);
  assert.match(result, /## References/);
  assert.match(result, /Example Reference/);
  assert.ok(result.includes(`[2025](${site.url}/blog/example#bib-collapsed2025)`));
  assert.ok(result.includes(`[2026](${site.url}/blog/example#bib-collapsed2026)`));
  assert.ok(result.includes('https://example.com/papers/reference'));
  assert.ok(result.includes(`![Example image](${site.url}/posts/example/image.avif)`));
  assert.ok(result.includes(`[Section](${site.url}/blog/example#example-42)`));
  assert.ok(result.includes(`[Problem PDF](${site.url}/posts/example/problem.pdf)`));
  assert.match(result, /Discovered locally/);
  assert.doesNotMatch(result, /<iframe|<script|<FixtureDiagram|pdf-viewer|code-header|class=/);
});

test('diagrams retain descriptions, labels, captions and component-authored TeX without SVG markup', () => {
  const result = htmlToAgentMarkdown(
    String.raw`<figure id="tree">
    <svg><title>Tree</title><desc>Root 1 connects to 2 and 3.</desc>
      <path d="M0 0"/><text>Node 1</text><text>Node 1</text>
      <foreignObject><div>\(w_i = 2\)</div></foreignObject>
    </svg><figcaption>Capacity \(c_i\) per node.</figcaption>
    <div><span>Heads</span><span><i></i>Cache</span></div>
    <div><strong>GQA</strong><span>Grouped query</span></div>
    </figure><p>H<sub>2</sub>O; x<sup>2</sup>. <code>\(literal\)</code></p>`,
    `${site.url}/blog/example`,
  );
  assert.match(result, /Root 1 connects to 2 and 3\./);
  assert.equal(result.match(/Node 1/g)?.length, 1);
  assert.ok(result.includes('$w_i = 2$'));
  assert.ok(result.includes('Capacity $c_i$ per node.'));
  assert.ok(result.includes('Heads Cache'));
  assert.ok(result.includes('**GQA** Grouped query'));
  assert.ok(result.includes(`${site.url}/blog/example#tree`));
  assert.match(result, /H<sub>2<\/sub>O; x<sup>2<\/sup>/);
  assert.ok(result.includes('`\\(literal\\)`'));
  assert.doesNotMatch(result, /<svg|<path|foreignObject|data-agent/);
});

test('profile exports every CV section from shared rich-text data and resolves links', () => {
  const result = renderProfileMarkdown(renderCvMarkdown(cv), site);
  assert.match(result, /^# Example 中文/);
  assert.match(result, /Research on \*\*models\*\*/);
  assert.match(result, /Authored \*HTML\*/);
  assert.match(result, /Literal \\\* title/);
  assert.match(result, /2025–2026/);
  assert.match(result, /Singapore/);
  assert.match(result, /### Service\n\n- Reviewer/);
  assert.ok(result.includes(`[Project](${site.url}/project)`));
  assert.ok(result.includes(`[Paper](${site.url}/paper.pdf)`));
  assert.ok(result.includes('https://example.com/result'));
});

test('agent files have canonical metadata, deterministic indexes, and prune unpublished articles', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'blog-agent-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const post: AgentPost = {
    slug: 'example',
    title: 'Example',
    description: 'An example.',
    date: '2026-01-01',
    markdownHtml: '<p>Full article</p>',
  };
  const older = { ...post, slug: 'older', date: '2025-01-01', updated: '2026-09-08' };
  const renderedCv = renderCvMarkdown(cv);
  const files = buildAgentFiles([older, post], renderedCv, site);
  const index = files.get('blog/index.md')!;
  assert.ok(index.indexOf('/blog/example.md') < index.indexOf('/blog/older.md'));
  assert.ok(files.get('llms.txt')?.includes(`${site.url}/profile.md`));
  assert.ok(files.get('llms.txt')?.includes(`${site.url}/blog/index.md`));
  assert.ok(files.get('blog/example.md')?.includes(`Canonical: <${site.url}/blog/example>`));
  assert.match(files.get('blog/example.md')!, /Published: 2026-01-01/);
  assert.doesNotMatch(files.get('blog/example.md')!, /Updated:/);
  assert.match(files.get('blog/older.md')!, /Updated: 2026-09-08/);
  assert.match(index, /Updated: 2026-09-08/);
  assert.ok(files.get('llms.txt')?.includes(`${site.url}/atom.xml`));
  writeAgentFiles(directory, files);
  assert.equal(
    readFileSync(join(directory, 'blog/example.md'), 'utf8'),
    files.get('blog/example.md'),
  );
  writeAgentFiles(directory, buildAgentFiles([], renderedCv, site));
  assert.equal(existsSync(join(directory, 'blog/example.md')), false);
  assert.equal(existsSync(join(directory, 'blog/older.md')), false);
  assert.match(readFileSync(join(directory, 'blog/index.md'), 'utf8'), /0 published articles/);
  assert.throws(() => buildAgentFiles([{ ...post, slug: 'index' }], renderedCv, site), /slug/);
});

test('nested Markdown exports include directory indexes and remove obsolete subtrees', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'blog-agent-nested-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const post: AgentPost = {
    slug: 'oi/codeforces/example',
    title: 'Example',
    date: '2019-01-01',
    updated: '2026-09-10',
    markdownHtml: '<p>Article</p>',
  };
  const renderedCv = renderCvMarkdown(cv);
  const files = buildAgentFiles([post], renderedCv, site);
  assert.doesNotMatch(files.get('blog/index.md')!, /undefined/);
  assert.doesNotMatch(files.get('blog/oi/codeforces/example.md')!, /undefined/);
  assert.match(files.get('blog/oi/codeforces/example.md')!, /Article/);
  assert.ok(
    files
      .get('blog/oi/codeforces/example.md')
      ?.includes(`Canonical: <${site.url}/blog/oi/codeforces/example>`),
  );
  assert.ok(files.get('blog/contents/index.md')?.includes(`${site.url}/blog/contents/oi/index.md`));
  assert.ok(
    files
      .get('blog/contents/oi/index.md')
      ?.includes(`${site.url}/blog/contents/oi/codeforces/index.md`),
  );
  assert.ok(
    files
      .get('blog/contents/oi/codeforces/index.md')
      ?.includes(`${site.url}/blog/oi/codeforces/example.md`),
  );
  assert.match(files.get('blog/contents/oi/index.md')!, /Latest post: 2019-01-01/);
  assert.doesNotMatch(files.get('blog/contents/oi/index.md')!, /2026-09-10|Updated:/);
  assert.match(files.get('blog/oi/codeforces/example.md')!, /Updated: 2026-09-10/);
  assert.equal(files.has('blog/oi/index.md'), false);
  writeAgentFiles(directory, files);
  assert.equal(
    readFileSync(join(directory, 'blog/oi/codeforces/example.md'), 'utf8'),
    files.get('blog/oi/codeforces/example.md'),
  );
  writeAgentFiles(directory, buildAgentFiles([], renderedCv, site));
  assert.equal(existsSync(join(directory, 'blog/oi')), false);
  assert.equal(existsSync(join(directory, 'blog/contents/oi')), false);
  assert.match(readFileSync(join(directory, 'blog/contents/index.md'), 'utf8'), /0 posts/);
  assert.doesNotMatch(
    readFileSync(join(directory, 'blog/contents/index.md'), 'utf8'),
    /undefined|Latest post:/,
  );
  for (const slug of ['oi/../example', 'oi//example', '/example', 'oi/index']) {
    assert.throws(() => buildAgentFiles([{ ...post, slug }], renderedCv, site), /slug/);
  }
});
