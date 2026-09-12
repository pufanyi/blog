import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { publishGeneratedFiles } from './generated-files.mts';

test('unchanged generated files preserve mtimes while obsolete subtrees are pruned', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'blog-generated-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const files = new Map([
    ['same.ts', 'same'],
    ['old/post.ts', 'old'],
  ]);
  publishGeneratedFiles([{ directory: root, files }]);
  const originalTime = new Date('2020-01-01');
  utimesSync(join(root, 'same.ts'), originalTime, originalTime);
  const result = publishGeneratedFiles([
    {
      directory: root,
      files: new Map([
        ['same.ts', 'same'],
        ['new.ts', 'new'],
      ]),
    },
  ]);
  assert.deepEqual(result, { changed: 1, removed: 1 });
  assert.equal(statSync(join(root, 'same.ts')).mtimeMs, originalTime.getTime());
  assert.equal(existsSync(join(root, 'old')), false);
  assert.equal(readFileSync(join(root, 'new.ts'), 'utf8'), 'new');
});

test('an output failure restores earlier replacements across generated trees', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'blog-generated-rollback-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const first = join(root, 'data');
  const second = join(root, 'assets');
  mkdirSync(first);
  mkdirSync(second);
  writeFileSync(join(first, 'post.ts'), 'previous');
  writeFileSync(join(second, 'blocked'), 'not a directory');
  const originalTime = new Date('2020-01-01');
  utimesSync(join(first, 'post.ts'), originalTime, originalTime);
  assert.throws(() =>
    publishGeneratedFiles([
      { directory: first, files: new Map([['post.ts', 'replacement']]) },
      { directory: second, files: new Map([['blocked/child.md', 'cannot install']]) },
    ]),
  );
  assert.equal(readFileSync(join(first, 'post.ts'), 'utf8'), 'previous');
  assert.equal(statSync(join(first, 'post.ts')).mtimeMs, originalTime.getTime());
  assert.equal(readFileSync(join(second, 'blocked'), 'utf8'), 'not a directory');
});

test('invalid output paths are rejected before publishing any tree', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'blog-generated-paths-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const path of ['../escape.ts', '/escape.ts', '.']) {
    assert.throws(
      () => publishGeneratedFiles([{ directory: root, files: new Map([[path, 'bad']]) }]),
      /escapes/,
    );
  }
});
