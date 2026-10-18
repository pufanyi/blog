import assert from 'node:assert/strict';
import { test } from 'node:test';
import { boundaryViolation, importSpecifiers } from './import-boundaries.mts';

test('boundary discovery includes re-exports, type edges and deferred imports', () => {
  assert.deepEqual(
    importSpecifiers(`
    import type { A } from './types';
    export { X } from '../reader/internal';
    const load = () => import('../reader/body');
    type M = import('./module').M;
    const text = "import('./not-code')";
  `),
    ['./types', '../reader/internal', '../reader/body', './module'],
  );
});

test('ownership rules reject reversed and cross-feature dependencies', () => {
  for (const [source, target] of [
    ['src/app/features/docs/docs.ts', 'src/app/features/reader/content/body.ts'],
    ['src/app/shared/ui/button.ts', 'src/app/features/search/modal.ts'],
    ['src/app/platform/metadata.ts', 'src/app/shell/toolbar.ts'],
    ['src/app/shell/toolbar.ts', 'src/app/features/search/search-engine.ts'],
    ['scripts/build-posts.mts', 'src/app/features/blog/data/posts.ts'],
    ['src/contracts/post.ts', 'src/app/data/posts.ts'],
  ])
    assert.ok(boundaryViolation(source, target), `${source} -> ${target}`);
});

test('feature-local work, route composition and narrow public entry points remain available', () => {
  for (const [source, target] of [
    ['src/app/features/reader/reader.ts', 'src/app/features/reader/content/body.ts'],
    ['src/app/features/blog/blog.routes.ts', 'src/app/features/reader/reader.routes.ts'],
    ['src/app/shell/toolbar.ts', 'src/app/features/search/search-launcher.ts'],
    ['src/app/features/docs/docs.ts', 'src/app/shared/rich-content/code-copy.ts'],
    ['scripts/build-posts.mts', 'src/contracts/post.model.ts'],
  ])
    assert.equal(boundaryViolation(source, target), undefined);
});
