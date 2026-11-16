import assert from 'node:assert/strict';
import test from 'node:test';
import {
  depthNdc,
  depths,
  position,
  xNdc,
} from '../../content/posts/cs/cs-revisit/computer-graphics/scripts/frustum-model';

test('perspective maps both boundaries to the NDC square and preserves ray alignment', () => {
  assert.ok(Math.abs(depthNdc(1) + 1) < 1e-12);
  assert.ok(Math.abs(depthNdc(10) - 1) < 1e-12);
  for (const d of depths) {
    assert.equal(xNdc(-d / 2, d), -1);
    assert.equal(xNdc(d / 2, d), 1);
    assert.equal(xNdc(d / 4, d), 0.5);
    assert.deepEqual(position(d / 4, d, 0), position(d / 4, d, 2, true));
  }
  const width = position(5, 10, 2)[0] - position(-5, 10, 2)[0];
  const height = position(0, 10, 2)[1] - position(0, 1, 2)[1];
  assert.ok(Math.abs(width - height) < 1e-12);
});

test('depth remains ordered while equally spaced distant slices become closer', () => {
  for (let d = 1; d < 9; d++) {
    const gap = depthNdc(d + 1) - depthNdc(d);
    const nextGap = depthNdc(d + 2) - depthNdc(d + 1);
    assert.ok(gap > nextGap && nextGap > 0);
  }
});
