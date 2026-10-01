import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  dijkstraFrames,
  distanceVectorFrames,
  failureFrames,
  prefixLookup,
} from '../../content/posts/cs/cs-revisit/computer-networks/architecture-and-routing/scripts/routing-model.ts';

test('DV propagates at most one more hop each round and agrees with shortest paths', () => {
  const frames = distanceVectorFrames();
  assert.deepEqual(
    frames.map(({ routes }) => ['A', 'B', 'C', 'D'].map((id) => routes[id].cost)),
    [
      [Infinity, Infinity, Infinity, 0],
      [7, 5, 2, 0],
      [6, 3, 2, 0],
      [4, 3, 2, 0],
    ],
  );
  assert.deepEqual(frames.at(-1)!.arrows, [
    ['A', 'B'],
    ['B', 'C'],
    ['C', 'D'],
  ]);
  assert.equal(frames[1].routes['A'].cost, 7, 'later frames must not mutate earlier snapshots');
});
test('a stale DV dependency counts to infinity while poison reverse prevents the two-node loop', () => {
  const plain = failureFrames(false);
  assert.equal(plain[2].routes['A'].cost, 3);
  assert.deepEqual(plain[2].arrows, [
    ['A', 'B'],
    ['B', 'A'],
  ]);
  for (const frame of plain.slice(1))
    assert.ok(!frame.arrows.some(([a, b]) => a === 'A' && b === 'D'));
  assert.equal(plain.at(-1)!.routes['A'].cost, Infinity);
  assert.equal(plain.at(-1)!.routes['B'].cost, Infinity);
  const poisoned = failureFrames(true);
  assert.ok(poisoned.every((frame) => !frame.arrows.some(([a, b]) => a === 'A' && b === 'B')));
  assert.deepEqual(poisoned.at(-1)!.arrows, []);
});
test('Dijkstra settles increasing distances and records predecessors rather than remote next hops', () => {
  const frames = dijkstraFrames();
  assert.deepEqual(
    frames.map(({ settled }) => settled.at(-1)),
    ['A', 'B', 'C', 'D'],
  );
  assert.deepEqual(
    Object.values(frames.at(-1)!.routes).map(({ cost }) => cost),
    [0, 1, 2, 4],
  );
  assert.equal(frames.at(-1)!.routes['D'].via, 'C');
  assert.equal(frames[0].routes['D'].cost, 7);
  assert.deepEqual(frames.at(-1)!.arrows, [
    ['A', 'B'],
    ['B', 'C'],
    ['C', 'D'],
  ]);
});
test('LPM handles nested exceptions, withdrawal, unsigned IPv4 boundaries and invalid input', () => {
  for (const [address, action] of [
    ['192.0.2.0', '出口 P'],
    ['192.0.2.255', '出口 P'],
    ['192.0.3.0', '出口 Q'],
    ['192.0.3.255', '出口 Q'],
    ['192.0.3.42', '出口 R'],
    ['192.0.4.0', '默认出口'],
    ['0.0.0.0', '默认出口'],
    ['255.255.255.255', '默认出口'],
  ])
    assert.equal(prefixLookup(address)!.action, action);
  assert.equal(prefixLookup('192.0.3.9', true)!.action, '出口 P');
  assert.equal(prefixLookup('192.0.3.42', true)!.action, '出口 R');
  for (const address of ['192.0.3', '192.0.3.256', '1.2.3.4.5', '1.2.3.-1', '01.2.3.4', ''])
    assert.equal(prefixLookup(address), null);
});
