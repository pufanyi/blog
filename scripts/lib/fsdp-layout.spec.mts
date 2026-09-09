import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  FSDP_PARAMETERS,
  fsdpLocalElements,
  POST_COMPONENTS,
} from '../../content/posts/ml-revisit-infra-fsdp/scripts/fsdp.post-component.tsx';

test('FSDP layouts partition the same parameters without losing or duplicating elements', () => {
  const expected = FSDP_PARAMETERS.flatMap((parameter) =>
    Array.from(
      { length: parameter.rows * parameter.columns },
      (_, index) => `${parameter.name}:${index}`,
    ),
  ).sort();
  for (const version of [1, 2] as const) {
    const shards = [0, 1].map((rank) => fsdpLocalElements(version, rank));
    assert.deepEqual(
      shards.map((shard) => shard.length),
      [12, 12],
    );
    assert.deepEqual(
      shards
        .flat()
        .map(({ parameter, index }) => `${parameter}:${index}`)
        .sort(),
      expected,
    );
  }
});

test('FSDP1 cuts through W2 while FSDP2 shards every parameter by rows', () => {
  const counts = (version: 1 | 2, rank: number) =>
    FSDP_PARAMETERS.map(
      ({ name }) =>
        fsdpLocalElements(version, rank).filter(({ parameter }) => parameter === name).length,
    );
  assert.deepEqual(counts(1, 0), [8, 4, 0]);
  assert.deepEqual(counts(1, 1), [0, 4, 8]);
  for (const rank of [0, 1]) {
    assert.deepEqual(counts(2, rank), [4, 4, 4]);
    for (const { name } of FSDP_PARAMETERS) {
      const rows = new Set(
        fsdpLocalElements(2, rank)
          .filter(({ parameter }) => parameter === name)
          .map(({ row }) => row),
      );
      assert.deepEqual([...rows], rank === 0 ? [0, 1] : [2, 3]);
    }
  }
});

test('FSDP comparison renders accessible panels and the computed local shards', () => {
  const document = new JSDOM(
    renderToStaticMarkup(createElement(POST_COMPONENTS.FsdpLayoutComparison)),
  ).window.document;
  assert.equal(document.querySelectorAll('figure svg[role="img"]').length, 2);
  const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const version of [1, 2] as const) {
    const svg = document.querySelectorAll('svg')[version - 1]!;
    for (const id of svg.getAttribute('aria-labelledby')!.split(' ')) {
      assert.ok(document.getElementById(id)?.textContent?.trim());
    }
    for (const rank of [0, 1]) {
      const group = svg.querySelector(`[data-fsdp-rank="${rank}"]`)!;
      assert.equal(group.getAttribute('data-element-count'), '12');
      const rendered = [...group.querySelectorAll('[data-parameter]')].flatMap((node) => {
        const indices = node.getAttribute('data-elements') ?? node.getAttribute('data-element')!;
        return indices.split(',').map((index) => `${node.getAttribute('data-parameter')}:${index}`);
      });
      assert.deepEqual(
        rendered,
        fsdpLocalElements(version, rank).map(({ parameter, index }) => `${parameter}:${index}`),
      );
    }
  }
  assert.match(document.querySelector('figcaption')!.textContent, /箭头表示布局变化/);
  assert.equal(document.querySelector('[role="region"]')?.getAttribute('tabindex'), '0');
});
