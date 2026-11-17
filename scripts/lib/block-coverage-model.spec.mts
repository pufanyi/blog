import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ALL_BLOCKS,
  BLOCK_COUNT,
  BLOCK_SIZE,
  classifyBoxAgainstTriangle,
  GLOBAL_PANEL_VIEW,
  getBlockInfo,
  pointInTriangle,
  TRIANGLE_VERTICES,
  toGlobalSvgX,
  toGlobalSvgY,
  toZoomSvgX,
  toZoomSvgY,
  ZOOM_PANEL_VIEW,
} from '../../content/posts/cs/cs-revisit/computer-graphics/scripts/block-coverage-model';

test('sample-box classification agrees with exhaustive 16-sample coverage across all blocks', () => {
  assert.equal(ALL_BLOCKS.length, BLOCK_COUNT * BLOCK_COUNT);

  for (const block of ALL_BLOCKS) {
    assert.equal(block.samples.length, BLOCK_SIZE * BLOCK_SIZE);
    const exactCovered = block.samples.filter((s) => pointInTriangle({ x: s.x, y: s.y })).length;
    assert.equal(block.coveredCount, exactCovered);
    assert.equal(block.linearExtremaClassification, block.classification);

    if (block.classification === 'early-in') {
      assert.equal(block.cornersInside, 4);
      assert.equal(block.coveredCount, 16);
    } else if (block.classification === 'early-out') {
      assert.equal(block.cornersInside, 0);
      assert.equal(block.sampleBoxIntersections.length, 0);
      assert.equal(block.coveredCount, 0);
    } else {
      assert.ok(block.cornersInside < 4);
      assert.ok(block.sampleBoxIntersections.length > 0);
    }
  }
});

test('canonical Slide-44 blocks and sample-box boundary wins match expected roles', () => {
  const earlyOut = getBlockInfo(0, 3);
  assert.equal(earlyOut.classification, 'early-out');
  assert.equal(earlyOut.coveredCount, 0);

  const earlyIn = getBlockInfo(2, 1);
  assert.equal(earlyIn.classification, 'early-in');
  assert.equal(earlyIn.coveredCount, 16);

  const apexElse = getBlockInfo(2, 3);
  assert.equal(apexElse.classification, 'else');
  assert.equal(apexElse.cornersInside, 1);
  assert.equal(apexElse.coveredCount, 8);

  // Sample bounding box [x0+0.5, x0+3.5] x [y0+0.5, y0+3.5] avoids false 'else' classifications
  // that the outer [x0, x0+4] x [y0, y0+4] pixel boundary would incur.
  const savedEarlyIn = getBlockInfo(2, 2);
  assert.equal(savedEarlyIn.classification, 'early-in');
  assert.equal(savedEarlyIn.naivePixelBoxClassification, 'else');
  assert.equal(savedEarlyIn.sampleBoxSavedTests, true);

  const savedEarlyOut = getBlockInfo(1, 3);
  assert.equal(savedEarlyOut.classification, 'early-out');
  assert.equal(savedEarlyOut.naivePixelBoxClassification, 'else');
  assert.equal(savedEarlyOut.sampleBoxSavedTests, true);
});

test('classifyBoxAgainstTriangle detects tiny triangles strictly inside a sample box as else', () => {
  const box = { xMin: 4.5, yMin: 4.5, xMax: 7.5, yMax: 7.5 };
  const tinyInside = [
    { x: 5.2, y: 5.2 },
    { x: 6.8, y: 5.3 },
    { x: 5.9, y: 6.7 },
  ] as const;
  const result = classifyBoxAgainstTriangle(box, tinyInside);
  assert.equal(result.cornersInside, 0);
  assert.equal(result.intersections.length, 0);
  assert.equal(result.classification, 'else');
});

test('global and zoom SVG coordinate transforms maintain equal x and y scales', () => {
  assert.equal(toGlobalSvgX(1) - toGlobalSvgX(0), GLOBAL_PANEL_VIEW.cell);
  assert.equal(toGlobalSvgY(0) - toGlobalSvgY(1), GLOBAL_PANEL_VIEW.cell);
  assert.equal(toZoomSvgX(9, 8) - toZoomSvgX(8, 8), ZOOM_PANEL_VIEW.cell);
  assert.equal(toZoomSvgY(12, 12) - toZoomSvgY(13, 12), ZOOM_PANEL_VIEW.cell);

  // Verify every sample center stays visually separated from all three triangle edges
  const [a, b, c] = TRIANGLE_VERTICES;
  const edges = [
    [a, b],
    [b, c],
    [c, a],
  ] as const;
  for (const block of ALL_BLOCKS) {
    for (const sample of block.samples) {
      for (const [u, v] of edges) {
        const len = Math.hypot(v.x - u.x, v.y - u.y);
        const dist =
          Math.abs((v.x - u.x) * (sample.y - u.y) - (v.y - u.y) * (sample.x - u.x)) / len;
        assert.ok(dist >= 0.08, `Sample (${sample.x}, ${sample.y}) too close to edge: ${dist}`);
      }
    }
  }
});
