import assert from 'node:assert/strict';
import test from 'node:test';
import {
  depthNdc,
  depths,
  position,
  progressFromFarWidth,
  xNdc,
} from '../../content/posts/cs/cs-revisit/computer-graphics/scripts/frustum-model';

test('perspective maps both boundaries to the NDC square and preserves ray alignment', () => {
  assert.ok(Math.abs(depthNdc(1) + 1) < 1e-12);
  assert.ok(Math.abs(depthNdc(10) - 1) < 1e-12);
  for (const d of depths) {
    assert.equal(xNdc(-d / 2, d), -1);
    assert.equal(xNdc(d / 2, d), 1);
    assert.equal(xNdc(d / 4, d), 0.5);
    assert.deepEqual(position(d / 4, d, 0), position(d / 4, d, 1, true));
  }
  const width = position(5, 10, 1)[0] - position(-5, 10, 1)[0];
  const height = position(0, 10, 1)[1] - position(0, 1, 1)[1];
  assert.ok(Math.abs(width - height) < 1e-12);
});

test('depth remains ordered while equally spaced distant slices become closer', () => {
  for (let d = 1; d < 9; d++) {
    const gap = depthNdc(d + 1) - depthNdc(d);
    const nextGap = depthNdc(d + 2) - depthNdc(d + 1);
    assert.ok(gap > nextGap && nextGap > 0);
  }
});

test('dragging transforms width and depth together while preserving straight edges', () => {
  for (const t of [0.2, 0.5, 0.8]) {
    const a = position(0.5, 1, t);
    const b = position(5, 10, t);
    const c = position(2, 4, t);
    const original = position(5, 10, 0);
    const final = position(5, 10, 1);
    for (const axis of [0, 1]) {
      assert.ok(b[axis] < original[axis] && b[axis] > final[axis]);
    }
    assert.ok(Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) < 1e-8);
    assert.ok(Math.abs(progressFromFarWidth(b[0] - 160) - t) < 1e-12);
  }
  assert.equal(progressFromFarWidth(200), 0);
  assert.equal(progressFromFarWidth(0), 1);
});
