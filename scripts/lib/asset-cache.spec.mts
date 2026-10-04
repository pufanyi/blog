import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { prepareAssetCacheHeaders } from './asset-cache.mts';

test('fingerprinted cache rules preserve MIME headers and exclude authored assets', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'blog-cache-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(join(directory, 'media'));
  for (const file of [
    'main-12345678.js',
    'chunk-Ab_cd-12.js',
    'styles-12345678.css',
    'media/phosphor-12345678.woff2',
    'avatar.svg',
    'index.html',
    'profile.md',
  ]) {
    writeFileSync(join(directory, file), 'asset');
  }
  writeFileSync(join(directory, '_headers'), '/profile.md\n  Content-Type: text/markdown\n');
  prepareAssetCacheHeaders(directory);
  const headers = readFileSync(join(directory, '_headers'), 'utf8');
  assert.match(headers, /Content-Type: text\/markdown/);
  for (const pattern of ['/main-*.js', '/chunk-*.js', '/styles-*.css', '/media/*']) {
    assert.ok(headers.includes(`${pattern}\n  Cache-Control: public, max-age=31536000, immutable`));
  }
  assert.doesNotMatch(headers, /\/(?:posts|assets)\/\*|\/index.html|\/avatar.svg/);
  prepareAssetCacheHeaders(directory);
  assert.equal(readFileSync(join(directory, '_headers'), 'utf8'), headers);
  writeFileSync(join(directory, 'media/unversioned.woff2'), 'font');
  assert.throws(() => prepareAssetCacheHeaders(directory), /unversioned build asset/);
});
