import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BRESENHAM_STEPS,
  computeZoomGeometry,
  END_POINT,
  GLOBAL_VIEW,
  GRID_COLS,
  GRID_ROWS,
  SLOPE,
  START_POINT,
  toGlobalX,
  toGlobalY,
} from '../../content/posts/cs/cs-revisit/computer-graphics/scripts/bresenham-model';

test('floor formula, midpoint threshold, and integer Bresenham recurrence select identical pixels', () => {
  assert.equal(BRESENHAM_STEPS.length, GRID_COLS);
  assert.equal(BRESENHAM_STEPS[0]?.sampleX, START_POINT.x);
  assert.equal(BRESENHAM_STEPS[0]?.centerY, START_POINT.y);
  assert.equal(BRESENHAM_STEPS.at(-1)?.sampleX, END_POINT.x);
  assert.equal(BRESENHAM_STEPS.at(-1)?.centerY, END_POINT.y);

  let bresY = 0;
  for (const step of BRESENHAM_STEPS) {
    // 1. Closed-form floor formula from the article prose
    const formulaCenter = Math.floor(SLOPE * (step.sampleX - START_POINT.x) + START_POINT.y) + 0.5;
    assert.equal(step.centerY, formulaCenter);

    // 2. Closest candidate pixel center on the active vertical scan line
    const distBase = Math.abs(step.exactY - (step.baseRow + 0.5));
    const distUpper = Math.abs(step.exactY - (step.upperRow + 0.5));
    assert.equal(step.steppedUp, step.index > 0 && distUpper < distBase);

    // 3. Integer Bresenham decision recurrence (no floating-point division)
    assert.equal(step.y, bresY);
    if (step.decision >= 0) bresY += 1;
  }
});

test('global and zoomed coordinate frames maintain equal axis scales and stay within grid bounds', () => {
  const dx = toGlobalX(1) - toGlobalX(0);
  const dy = toGlobalY(0) - toGlobalY(1);
  assert.equal(dx, GLOBAL_VIEW.cell);
  assert.equal(dy, GLOBAL_VIEW.cell);

  for (let i = 0; i < GRID_COLS; i++) {
    const zoom = computeZoomGeometry(i);
    assert.ok(zoom.winX0 >= 0 && zoom.winX0 + 2 <= GRID_COLS);
    assert.ok(zoom.winY0 >= 0 && zoom.winY0 + 2 <= GRID_ROWS);
    assert.ok(Math.abs(zoom.exactLabelY - zoom.boundarySvgY) >= 10);
  }
});
