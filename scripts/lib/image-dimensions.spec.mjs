import assert from 'node:assert/strict';
import { unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { getSvgDimensions } from './image-dimensions.mjs';

test('reads SVG dimensions from its viewBox', (t) => {
  const file = join(tmpdir(), `image-dimensions-${process.pid}-${Date.now()}.svg`);
  t.after(() => unlinkSync(file));
  writeFileSync(
    file,
    '<svg xmlns="http://www.w3.org/2000/svg" width="1558pt" height="323pt" viewBox="0 0 1558 323"></svg>',
  );

  assert.deepEqual(getSvgDimensions(file), { width: 1558, height: 323 });
});

test('falls back to explicit SVG dimensions without a viewBox', (t) => {
  const file = join(tmpdir(), `image-dimensions-fallback-${process.pid}-${Date.now()}.svg`);
  t.after(() => unlinkSync(file));
  writeFileSync(file, '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"></svg>');

  assert.deepEqual(getSvgDimensions(file), { width: 640, height: 480 });
});
