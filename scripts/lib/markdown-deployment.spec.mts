import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type TestContext, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { prepareMarkdownWorker } from './markdown-deployment.mts';
import type { createMarkdownWorker } from './markdown-negotiation.mts';

function fixture(t: TestContext, pages: Record<string, string | null>): string {
  const directory = mkdtempSync(join(tmpdir(), 'blog-markdown-deployment-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const browser = join(directory, 'browser');
  writeFileSync(
    join(directory, 'prerendered-routes.json'),
    JSON.stringify({
      routes: Object.fromEntries(Object.keys(pages).map((route) => [route, {}])),
    }),
  );
  for (const [route, alternate] of Object.entries(pages)) {
    mkdirSync(join(browser, route), { recursive: true });
    const link = alternate ? `<link rel="alternate" type="text/markdown" href="${alternate}">` : '';
    writeFileSync(
      join(browser, route, 'index.html'),
      `<html><head>${link}</head><body></body></html>`,
    );
  }
  return browser;
}

test('deployment derives alternatives from rendered pages and emits a runnable Worker outside assets', async (t) => {
  const browser = fixture(t, {
    '/': 'https://example.com/profile.md',
    '/cv': 'https://example.com/profile.md',
    '/blog/page/2': 'https://example.com/blog/index.md',
    '/blog/post': 'https://example.com/blog/post.md',
    '/404': null,
    '/pdf-viewer': null,
  });
  writeFileSync(join(browser, 'profile.md'), '# Profile');
  writeFileSync(join(browser, 'blog/index.md'), '# Index');
  writeFileSync(join(browser, 'blog/post.md'), '# Post');
  // Orphaned exports must not create new original-page routes.
  writeFileSync(join(browser, 'blog/draft.md'), '# Draft');
  assert.equal(prepareMarkdownWorker(browser, 'https://example.com'), 4);
  const routes = JSON.parse(readFileSync(join(browser, '../markdown-routes.json'), 'utf8'));
  assert.deepEqual(routes, {
    '/': 'https://example.com/profile.md',
    '/blog/page/2': 'https://example.com/blog/index.md',
    '/blog/post': 'https://example.com/blog/post.md',
    '/cv': 'https://example.com/profile.md',
  });
  assert.equal(existsSync(join(browser, 'worker.mjs')), false);
  assert.equal(existsSync(join(browser, 'markdown-routes.json')), false);
  const module = (await import(pathToFileURL(join(browser, '../worker.mjs')).href)) as {
    default: ReturnType<typeof createMarkdownWorker>;
  };
  const response = await module.default.fetch(
    new Request('https://example.com/blog/post', {
      headers: { Accept: 'text/markdown' },
    }),
    {
      ASSETS: {
        async fetch(request) {
          return new Response(readFileSync(join(browser, new URL(request.url).pathname), 'utf8'));
        },
      },
    },
  );
  assert.equal(await response.text(), '# Post');
  assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
});

test('deployment fails when an advertised Markdown file is missing or outside site assets', (t) => {
  for (const alternate of [
    'https://other.example/post.md',
    'https://example.com/missing.md',
    'https://example.com/post.md?query=value',
    'https://example.com/post.md#fragment',
    'https://example.com/post.html',
    'https://example.com/%2fetc.md',
  ]) {
    const browser = fixture(t, { '/blog/post': alternate });
    assert.throws(() => prepareMarkdownWorker(browser, 'https://example.com'), /Markdown|ENOENT/);
  }
});
