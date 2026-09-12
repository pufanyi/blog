import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createExampleGraph,
  example,
} from '../../content/posts/oi-icpc/codeforces/cf434d/scripts/flow.post-component.tsx';

function minimumCut(sentinels: boolean): number {
  const graph = createExampleGraph(sentinels);
  const internal = graph.nodes.filter((node) => node.id !== 'S' && node.id !== 'T');
  let minimum = Infinity;
  for (let mask = 0; mask < 2 ** internal.length; mask++) {
    const sourceSide = new Set(['S']);
    for (const [index, node] of internal.entries()) {
      if (mask & (1 << index)) sourceSide.add(node.id);
    }
    const capacity = graph.edges
      .filter((edge) => sourceSide.has(edge.from) && !sourceSide.has(edge.to))
      .reduce((sum, edge) => sum + edge.capacity, 0);
    minimum = Math.min(minimum, capacity);
  }
  return minimum;
}

test('CF434D endpoint diagrams reproduce the counterexample and recover the constrained optimum', () => {
  const [first, second] = example.functions;
  assert.ok(first && second);
  let optimum = -Infinity;
  for (let x1 = first.l; x1 <= first.r; x1++) {
    for (let x2 = second.l; x2 <= second.r; x2++) {
      const values = new Map([
        [1, x1],
        [2, x2],
      ]);
      if (!example.constraints.every(({ u, v, d }) => values.get(u)! <= values.get(v)! + d))
        continue;
      const profit = example.functions.reduce((sum, fn) => {
        const x = values.get(fn.id)!;
        return sum + fn.a * x * x + fn.b * x + fn.c;
      }, 0);
      optimum = Math.max(optimum, profit);
    }
  }
  const total = example.functions.length * example.lim;
  assert.equal(optimum, 5);
  assert.equal(total - minimumCut(false), 6);
  assert.equal(total - minimumCut(true), optimum);

  for (const sentinels of [false, true]) {
    const graph = createExampleGraph(sentinels);
    const cut = graph.edges.filter((edge) => edge.cutAt);
    assert.equal(
      cut.reduce((sum, edge) => sum + edge.capacity, 0),
      minimumCut(sentinels),
    );
    const removed = new Set(cut);
    const reachable = new Set(['S']);
    for (let remaining = graph.nodes.length; remaining > 0; remaining--) {
      for (const edge of graph.edges) {
        if (!removed.has(edge) && reachable.has(edge.from)) reachable.add(edge.to);
      }
    }
    assert.ok(!reachable.has('T'), 'The highlighted edges must disconnect S from T');
  }
});
