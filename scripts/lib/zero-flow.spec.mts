import assert from 'node:assert/strict';
import { test } from 'node:test';
import { zeroTransfers } from '../../content/posts/ml-revisit-infra-fsdp/scripts/zero-flow.post-component.tsx';

test('ZeRO flow arrows reduce matching gradient shards and replicate the updated model', () => {
  const gradients = [
    [10, 11, 12, 13],
    [20, 21, 22, 23],
    [30, 31, 32, 33],
    [40, 41, 42, 43],
  ];
  const reduced = [0, 0, 0, 0];
  const contributors = Array.from({ length: 4 }, () => new Set<number>());
  for (const { source, destination, shard } of zeroTransfers('reduce-scatter')) {
    assert.equal(shard, destination, 'Each GPU must receive only its own gradient shard');
    assert.ok(!contributors[destination]!.has(source), 'Each source contributes once');
    contributors[destination]!.add(source);
    reduced[destination]! += gradients[source]![shard]! / gradients.length;
  }
  assert.deepEqual(reduced, [25, 26, 27, 28]);
  assert.ok(contributors.every((sources) => sources.size === 4));

  const weights = [100, 200, 300, 400];
  const updated = weights.map((weight, rank) => weight - 0.1 * reduced[rank]!);
  const models: (number | undefined)[][] = Array.from({ length: 4 }, () =>
    Array(4).fill(undefined),
  );
  for (const { source, destination, shard } of zeroTransfers('all-gather')) {
    assert.equal(models[destination]![shard], undefined, 'Do not overwrite or duplicate a shard');
    models[destination]![shard] = updated[source];
  }
  for (const model of models) assert.deepEqual(model, [97.5, 197.4, 297.3, 397.2]);
});
