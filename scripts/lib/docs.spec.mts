import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test, { type TestContext } from 'node:test';
import { JSDOM } from 'jsdom';
import { buildDocs } from './docs.mts';

function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'blog-docs-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (file: string, content: string) => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), content);
  };
  write(
    'docs/navigation.json',
    JSON.stringify({
      sourceUrl: 'https://github.com/example/blog/blob/main',
      groups: [{ title: 'Guides', pages: ['index.md', 'writing/example.md'] }],
    }),
  );
  write('docs/index.md', '# Handbook\n\nStart here.\n\n[Example](writing/example.md#same-1)\n');
  write(
    'docs/writing/example.md',
    '# Example\n\nAn explanation.\n\n## Same\n\nFirst.\n\n## Same\n\nSecond.\n',
  );
  return { root, write };
}

test('documentation shares source prose, stable headings, lazy modules, and working source links', async (t) => {
  const { root, write } = fixture(t);
  write('package.json', '{}');
  write(
    'docs/writing/example.md',
    readFileSync(join(root, 'docs/writing/example.md'), 'utf8') +
      '\n[Source](../../package.json)\n\n[Home](../index.md)\n\n```typescript\nconst value = 1; // [!code highlight]\n```\n\n| A | B |\n| --- | --- |\n| One | Two |\n',
  );
  const result = await buildDocs(root, 'https://example.com');
  const home = result.dataFiles.get('docs/index.ts')!;
  assert.match(home, /\/docs\/writing\/example#same-1/);
  const module = result.dataFiles.get('docs/writing/example.ts')!;
  const page = JSON.parse(
    module.slice(module.indexOf('export default ') + 15, module.lastIndexOf(' satisfies')),
  );
  const dom = new JSDOM(page.contentHtml);
  t.after(() => dom.window.close());
  assert.equal(dom.window.document.querySelector('h1'), null);
  assert.equal(dom.window.document.querySelector('#same-1')?.textContent?.trim(), 'Same');
  assert.equal(
    dom.window.document.querySelector('a[href*="package.json"]')?.getAttribute('href'),
    'https://github.com/example/blog/blob/main/package.json',
  );
  assert.ok(dom.window.document.querySelector('.table-wrapper[tabindex="0"] table'));
  assert.ok(dom.window.document.querySelector('.shiki .highlighted'));
  assert.match(
    result.agentFiles.get('docs/writing/example.md')!,
    /const value = 1; \/\/ \[!code highlight\]/,
  );
  assert.doesNotMatch(
    result.agentFiles.get('docs/writing/example.md')!,
    /code-copy|heading-permalink|<span/,
  );
  assert.doesNotMatch(result.dataFiles.get('docs.ts')!, /const value|contentHtml/);
  assert.match(result.dataFiles.get('doc-loaders.ts')!, /import\("\.\/docs\/writing\/example"\)/);
});

test('broken document paths, source paths, and cross-page anchors fail with source context', async (t) => {
  const { root, write } = fixture(t);
  for (const link of [
    'writing/missing.md',
    'writing/example.md#missing',
    '../missing.ts',
    '../../../outside.md',
  ]) {
    write('docs/index.md', `# Handbook\n\n[Broken](${link})\n`);
    await assert.rejects(
      buildDocs(root, 'https://example.com'),
      /docs\/index.md: (missing|link escapes)/,
    );
  }
});

test('navigation rejects orphan pages, duplicate entries, and missing page titles', async (t) => {
  const { root, write } = fixture(t);
  write('docs/orphan.md', '# Orphan\n');
  await assert.rejects(buildDocs(root, 'https://example.com'), /every Markdown file/);
  rmSync(join(root, 'docs/orphan.md'));
  write('docs/writing/example.md', 'No heading.\n');
  await assert.rejects(buildDocs(root, 'https://example.com'), /exactly one level-one title/);
  write(
    'docs/navigation.json',
    JSON.stringify({
      sourceUrl: 'https://example.com/source',
      groups: [{ title: 'Guides', pages: ['index.md', 'index.md'] }],
    }),
  );
  await assert.rejects(buildDocs(root, 'https://example.com'), /duplicate page/);
});
