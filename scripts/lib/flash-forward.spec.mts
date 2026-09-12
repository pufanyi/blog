import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { POST_COMPONENTS } from '../../content/posts/ml/ml-revisit/infra/flash-attention/scripts/interactive.post-component';
import {
  buildFrames,
  GRID_UNIT,
  KV_TILE_SIZES,
  partition,
  QUERY_TILES,
  SEQUENCE_LENGTH,
} from '../../src/app/utils/flash-forward/model';
import { initFlashForward } from '../../src/app/utils/flash-forward/player';
import { htmlToAgentMarkdown } from './agent-markdown.mts';

const markup = () => renderToStaticMarkup(createElement(POST_COMPONENTS.FlashForwardInteractive));

test('tiles cover every query-key pair exactly once, including incomplete final tiles', () => {
  assert.deepEqual(partition(10, 4), [
    { index: 0, start: 0, end: 4 },
    { index: 1, start: 4, end: 8 },
    { index: 2, start: 8, end: 10 },
  ]);
  for (const size of KV_TILE_SIZES) {
    const visits = Array.from({ length: SEQUENCE_LENGTH }, () =>
      Array<number>(SEQUENCE_LENGTH).fill(0),
    );
    const tiles = partition(SEQUENCE_LENGTH, size);
    for (const query of QUERY_TILES) {
      const frames = buildFrames(size, query.index);
      assert.deepEqual(
        frames.slice(0, 3).map((frame) => frame.phase),
        ['sequence', 'partition', 'query'],
      );
      let covered = 0;
      for (const frame of frames.slice(3, -1)) {
        const tile = tiles[frame.kv!];
        if (frame.phase === 'tile') {
          assert.equal(frame.processed, covered, 'reading a tile must not advance merged coverage');
          for (let row = query.start; row < query.end; row++) {
            for (let col = tile.start; col < tile.end; col++) visits[row][col]++;
          }
        } else {
          assert.equal(frame.phase, 'merge');
          assert.equal(tile.start, covered);
          covered = tile.end;
          assert.equal(frame.processed, covered);
        }
      }
      assert.equal(covered, SEQUENCE_LENGTH);
      assert.equal(frames.at(-1)?.phase, 'output');
      assert.equal(frames.at(-1)?.processed, SEQUENCE_LENGTH);
    }
    assert.ok(visits.flat().every((count) => count === 1));
  }
});

test('the rendered grid matches token ranges at either block size', () => {
  const dom = new JSDOM(markup());
  try {
    for (const size of KV_TILE_SIZES) {
      const layout = dom.window.document.querySelector(`[data-layout="${size}"]`)!;
      const tiles = partition(SEQUENCE_LENGTH, size);
      assert.equal(layout.querySelectorAll('.flash-player-tokens span').length, SEQUENCE_LENGTH);
      assert.equal(
        layout.querySelectorAll('[data-map-cell]').length,
        QUERY_TILES.length * tiles.length,
      );
      for (const query of QUERY_TILES) {
        for (const tile of tiles) {
          const rect = layout.querySelector(`[data-map-cell="${query.index}-${tile.index}"] rect`)!;
          assert.equal(Number(rect.getAttribute('x')) / GRID_UNIT, tile.start);
          assert.equal(Number(rect.getAttribute('y')) / GRID_UNIT, query.start);
          assert.equal(Number(rect.getAttribute('width')) / GRID_UNIT, tile.end - tile.start);
          assert.equal(Number(rect.getAttribute('height')) / GRID_UNIT, query.end - query.start);
        }
      }
    }
  } finally {
    dom.window.close();
  }
});

test('playback merges only the selected query band, reuses the temporary tile, and cleans up', () => {
  const dom = new JSDOM(markup(), { pretendToBeVisual: true });
  const { window } = dom;
  const timers = new Map<number, () => void>();
  let timerId = 0;
  let disconnects = 0;
  let visibility: ((visible: boolean) => void) | undefined;
  Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: true }) });
  Object.defineProperty(window, 'IntersectionObserver', {
    value: class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        visibility = (visible) => callback([{ isIntersecting: visible }]);
      }
      observe() {
        return;
      }
      disconnect() {
        disconnects++;
      }
    },
  });
  window.setTimeout = (handler: TimerHandler) => {
    timers.set(++timerId, handler as () => void);
    return timerId;
  };
  window.clearTimeout = (id) => {
    timers.delete(id ?? 0);
  };
  const root = window.document.querySelector<HTMLElement>('[data-flash-forward]')!;
  const button = (action: string) =>
    root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!;
  const progress = root.querySelector<HTMLInputElement>('[data-progress]')!;
  const seek = (step: number) => {
    progress.value = String(step);
    progress.dispatchEvent(new window.Event('input', { bubbles: true }));
  };
  const layout = (size: number) => root.querySelector<HTMLElement>(`[data-layout="${size}"]`)!;
  try {
    const cleanup = initFlashForward(window.document.body);
    const scratch = layout(4).querySelector('.flash-player-mini-tile');
    assert.equal(root.dataset['phase'], 'sequence');
    button('play').click();
    assert.equal(timers.size, 1);
    button('next').click();
    assert.equal(timers.size, 0);
    assert.equal(root.dataset['phase'], 'partition');
    seek(3);
    assert.equal(layout(4).querySelectorAll('[data-map-cell][data-status="current"]').length, 1);
    assert.equal(layout(4).querySelector('[data-field="covered"]')?.textContent, '0 / 24');
    seek(4);
    assert.equal(layout(4).querySelectorAll('[data-map-cell][data-status="merged"]').length, 1);
    assert.equal(layout(4).querySelector('[data-field="covered"]')?.textContent, '4 / 24');
    assert.equal(
      layout(4).querySelector('[data-scan-window]')?.getAttribute('visibility'),
      'hidden',
    );
    assert.equal(layout(4).querySelector('[data-field="buffer"]')?.textContent, '临时空间已释放');
    seek(5);
    assert.equal(layout(4).querySelector('.flash-player-mini-tile'), scratch);
    assert.equal(
      layout(4).querySelector('[data-scan-window]')?.getAttribute('x'),
      String(4 * GRID_UNIT),
    );
    seek(15);
    assert.equal(layout(4).querySelectorAll('[data-status="written"]').length, 1);
    assert.equal(
      layout(4).querySelector('[data-output="2"]')?.getAttribute('data-status'),
      'written',
    );
    layout(4).querySelector<HTMLButtonElement>('[data-query="4"]')!.click();
    assert.equal(root.dataset['phase'], 'query');
    assert.equal(layout(4).querySelectorAll('[data-map-cell][data-status="merged"]').length, 0);
    const size = root.querySelector<HTMLSelectElement>('[data-tile-size]')!;
    size.value = '8';
    size.dispatchEvent(new window.Event('change', { bubbles: true }));
    assert.equal(layout(4).hidden, true);
    assert.equal(layout(8).hidden, false);
    assert.equal(progress.max, '9');
    seek(8);
    assert.equal(layout(8).querySelectorAll('[data-map-cell][data-status="merged"]').length, 3);
    button('play').click();
    const [id, tick] = [...timers.entries()][0];
    timers.delete(id);
    tick();
    assert.equal(root.dataset['phase'], 'output');
    assert.equal(
      layout(8).querySelector('[data-output="4"]')?.getAttribute('data-status'),
      'written',
    );
    assert.equal(button('play').textContent, '重播');
    assert.equal(timers.size, 0);
    button('play').click();
    visibility?.(false);
    assert.equal(timers.size, 0);
    button('play').click();
    Object.defineProperty(window.document, 'hidden', { value: true });
    window.document.dispatchEvent(new window.Event('visibilitychange'));
    assert.equal(timers.size, 0);
    button('play').click();
    cleanup();
    assert.equal(timers.size, 0);
    assert.equal(disconnects, 1);
    button('next').click();
    assert.equal(root.dataset['step'], '0');
    const cleanupAgain = initFlashForward(window.document.body);
    button('next').click();
    assert.equal(root.dataset['step'], '1');
    cleanupAgain();
  } finally {
    dom.window.close();
  }
});

test('static HTML and Markdown explain tiling without the playback controls or scalar derivation', () => {
  const html = markup();
  assert.match(html, /data-phase="partition"/);
  const markdown = htmlToAgentMarkdown(
    html,
    'https://pufanyi.com/blog/ml/ml-revisit/infra/flash-attention',
  );
  assert.match(markdown, /24 个 token/);
  assert.match(markdown, /分别扫描 6 或 3 次/);
  assert.match(markdown, /同一份运行状态/);
  assert.match(markdown, /不保存完整 score 矩阵/);
  assert.doesNotMatch(markdown, /下一步|重置|逐块数值核对|49|1\.875/);
});
