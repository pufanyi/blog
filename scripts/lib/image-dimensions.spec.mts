import assert from 'node:assert/strict';
import { unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { getImageDimensions } from './image-dimensions.mts';

test('reads SVG dimensions from its viewBox', (t) => {
  const file = join(tmpdir(), `image-dimensions-${process.pid}-${Date.now()}.svg`);
  t.after(() => unlinkSync(file));
  writeFileSync(
    file,
    '<svg xmlns="http://www.w3.org/2000/svg" width="1558pt" height="323pt" viewBox="0 0 1558 323"></svg>',
  );

  assert.deepEqual(getImageDimensions(file), { width: 1558, height: 323 });
});

test('falls back to explicit SVG dimensions without a viewBox', (t) => {
  const file = join(tmpdir(), `image-dimensions-fallback-${process.pid}-${Date.now()}.svg`);
  t.after(() => unlinkSync(file));
  writeFileSync(file, '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"></svg>');

  assert.deepEqual(getImageDimensions(file), { width: 640, height: 480 });
});

test('reads AVIF dimensions without an external image program', () => {
  const file = fileURLToPath(new URL('./fixtures/dimensions.avif', import.meta.url));
  assert.deepEqual(getImageDimensions(file), { width: 16, height: 10 });
});

test('returns null for missing or invalid images', (t) => {
  const file = join(tmpdir(), `image-dimensions-invalid-${process.pid}-${Date.now()}.avif`);
  assert.equal(getImageDimensions(file), null);
  writeFileSync(file, 'not an image');
  t.after(() => unlinkSync(file));
  assert.equal(getImageDimensions(file), null);
});
