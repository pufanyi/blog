import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { POST_COMPONENTS } from '../../content/posts/ml/ml-revisit/infra/flash-attention/scripts/interactive.post-component';
import { buildFrames, EXAMPLE } from '../../src/app/utils/flash-forward/model';
import { initFlashForward } from '../../src/app/utils/flash-forward/player';
import { htmlToAgentMarkdown } from './agent-markdown.mts';

const markup = () => renderToStaticMarkup(createElement(POST_COMPONENTS.FlashForwardInteractive));
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} ≠ ${expected}`);

test('every completed tile preserves the dense attention numerator and denominator', () => {
  for (const reverse of [false, true]) {
    const frames = buildFrames(reverse);
    for (const frame of frames.filter((frame) => frame.phase === 'release')) {
      frame.rows.forEach((state, row) => {
        const columns = frame.completed.flatMap((tile) => [2 * tile, 2 * tile + 1]);
        const scores = columns.map(
          (col) => EXAMPLE.queries[row] * Math.log(EXAMPLE.exponentials[col]),
        );
        close(state.m, Math.max(...scores));
        close(
          state.ell,
          scores.reduce((sum, score) => sum + Math.exp(score - state.m), 0),
        );
        close(
          state.u,
          scores.reduce(
            (sum, score, index) => sum + Math.exp(score - state.m) * EXAMPLE.values[columns[index]],
            0,
          ),
        );
      });
    }
    const final = frames.at(-1)!;
    close(final.rows[0].u / final.rows[0].ell, 49 / 15);
    close(final.rows[1].u / final.rows[1].ell, 313 / 85);
    close(final.rows[0].m + Math.log(final.rows[0].ell), Math.log(15));
    close(final.rows[1].m + Math.log(final.rows[1].ell), Math.log(85));
    assert.deepEqual(
      frames[0].rows.map((row) => row.m),
      [-Infinity, -Infinity],
    );
    const merges = frames.filter((frame) => frame.phase === 'rescale');
    assert.deepEqual(
      merges[0].merge.map((row) => row.alpha),
      [0, 0],
    );
    merges[1].merge.forEach((row, index) => close(row.alpha, reverse ? 1 : [1 / 4, 1 / 16][index]));
  }
});

test('the player pauses on manual input, offscreen, and cleanup, and can be initialized again', () => {
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
      observe() {}
      disconnect() {
        disconnects++;
      }
    },
  });
  window.setTimeout = (handler: TimerHandler) => {
    assert.equal(typeof handler, 'function');
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
  try {
    const cleanup = initFlashForward(window.document.body);
    assert.equal(root.dataset['ready'], 'true');
    button('play').click();
    assert.equal(timers.size, 1);
    assert.equal(button('play').textContent, '暂停');
    button('next').click();
    assert.equal(timers.size, 0);
    assert.equal(root.dataset['step'], '1');
    button('previous').click();
    assert.equal(root.dataset['step'], '0');
    seek(8);
    assert.equal(root.querySelector('[data-merge-value="alpha"]')?.textContent, '0.25');
    seek(9);
    assert.match(
      root.querySelector('[data-merge-value="ell"]')?.textContent ?? '',
      /0.25 × 1.5 \+ 1.5 = 1.875/,
    );
    seek(10);
    assert.deepEqual(
      [...root.querySelectorAll('[data-cell]')].map((cell) => cell.textContent),
      ['—', '—', '—', '—'],
    );
    button('play').click();
    const [id, tick] = [...timers.entries()][0];
    timers.delete(id);
    tick();
    assert.equal(root.dataset['phase'], 'normalize');
    assert.equal(button('play').textContent, '重播');
    assert.equal(timers.size, 0);
    assert.match(root.querySelector('[data-output-row="0"]')?.textContent ?? '', /3.2667/);
    button('play').click();
    assert.equal(root.dataset['step'], '0');
    visibility?.(false);
    assert.equal(timers.size, 0);
    const order = root.querySelector<HTMLInputElement>('[data-order]')!;
    order.checked = true;
    order.dispatchEvent(new window.Event('change', { bubbles: true }));
    seek(8);
    assert.equal(root.querySelector('[data-merge-value="alpha"]')?.textContent, '1');
    button('play').click();
    cleanup();
    assert.equal(timers.size, 0);
    assert.equal(disconnects, 1);
    button('next').click();
    assert.equal(root.dataset['step'], '8');
    const cleanupAgain = initFlashForward(window.document.body);
    button('next').click();
    assert.equal(root.dataset['step'], '1');
    cleanupAgain();
  } finally {
    dom.window.close();
  }
});

test('static HTML and Markdown retain the example, formulas, and reference outputs', () => {
  const html = markup();
  assert.match(html, /data-controls="" hidden|hidden="" data-controls/);
  const markdown = htmlToAgentMarkdown(
    html,
    'https://pufanyi.com/blog/ml/ml-revisit/infra/flash-attention',
  );
  assert.match(markdown, /\\frac\{49\}\{15\}/);
  assert.match(markdown, /\\frac\{313\}\{85\}/);
  assert.match(markdown, /\\alpha U\+WV_j/);
  assert.match(markdown, /其余 query tile 独立执行/);
  assert.doesNotMatch(markdown, /下一步|重置/);
  assert.match(markdown, /逐块数值核对/);
  assert.match(markdown, /1\.875/);
  assert.doesNotMatch(markdown, /待合并|待读取|实线：/);
});
