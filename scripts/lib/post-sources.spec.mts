import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { discoverPostSources } from './post-sources.mts';

test('discovers flat and deeply nested posts without traversing article assets', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'blog-sources-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const path of [
    'flat/index.mdx',
    'oi/codeforces/example/index.mdx',
    'ml/infra/example/index.mdx',
    'ml/infra/example/scripts/component.tsx',
    'ml/infra/example/images/index.mdx',
  ]) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), 'fixture');
  }
  mkdirSync(join(root, 'empty'));
  assert.deepEqual(
    discoverPostSources(root),
    ['flat', 'ml/infra/example', 'oi/codeforces/example'].map((slug) => ({
      slug,
      sourcePath: join(root, slug, 'index.mdx'),
    })),
  );
});

test('rejects paths that collide with archive or Markdown indexes', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'blog-sources-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const path of ['page', 'contents']) {
    mkdirSync(join(root, path));
    assert.throws(() => discoverPostSources(root), /reserved/i);
    rmSync(join(root, path), { recursive: true });
  }
  mkdirSync(join(root, 'category/index'), { recursive: true });
  writeFileSync(join(root, 'category/index/index.mdx'), 'fixture');
  assert.throws(() => discoverPostSources(root), /reserved/i);
});
