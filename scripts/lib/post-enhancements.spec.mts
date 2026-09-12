import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import type { PostEnhancementModule } from '../../src/app/models/post-enhancement.model';
import { bindPostEnhancements } from '../../src/app/utils/post-enhancements';

test('navigation before a deferred module resolves never attaches its controls', async (t) => {
  const dom = new JSDOM('<article>Static explanation</article>');
  t.after(() => dom.window.close());
  const container = dom.window.document.querySelector('article')!;
  let resolve!: (module: PostEnhancementModule) => void;
  const loaded = new Promise<PostEnhancementModule>((done) => {
    resolve = done;
  });
  let attached = false;
  const dispose = bindPostEnhancements(container, [() => loaded]);
  dispose();
  resolve({
    enhancePost: () => {
      attached = true;
      return () => undefined;
    },
  });
  await setImmediate();
  assert.equal(attached, false);
  assert.equal(container.textContent, 'Static explanation');
});

test('failed imports retain static content and cleanup continues after another cleanup fails', async (t) => {
  const dom = new JSDOM('<article>Static explanation</article>');
  t.after(() => dom.window.close());
  const container = dom.window.document.querySelector('article')!;
  const errors: unknown[] = [];
  let cleaned = 0;
  const dispose = bindPostEnhancements(
    container,
    [
      async () => {
        throw new Error('offline');
      },
      async () => ({
        enhancePost: () => () => {
          cleaned++;
        },
      }),
      async () => ({
        enhancePost: () => () => {
          throw new Error('cleanup');
        },
      }),
    ],
    (error) => errors.push(error),
  );
  await setImmediate();
  assert.equal(container.textContent, 'Static explanation');
  dispose();
  dispose();
  assert.equal(cleaned, 1);
  assert.deepEqual(
    errors.map((error) => (error as Error).message),
    ['offline', 'cleanup'],
  );
});
