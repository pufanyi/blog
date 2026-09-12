import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { createBuildQueue } from './build-queue.mts';

test('watch queue coalesces saves, serializes rebuilds, recovers from failure, and drains on close', async () => {
  let runs = 0;
  let active = 0;
  const errors: unknown[] = [];
  let release!: () => void;
  const first = new Promise<void>((resolve) => {
    release = resolve;
  });
  let signalStarted!: () => void;
  const started = new Promise<void>((resolve) => {
    signalStarted = resolve;
  });
  let signalRecovered!: () => void;
  const recovered = new Promise<void>((resolve) => {
    signalRecovered = resolve;
  });
  const queue = createBuildQueue(
    async () => {
      assert.equal(++active, 1);
      runs++;
      if (runs === 1) {
        signalStarted();
        await first;
        active--;
        throw new Error('An invalid draft');
      }
      active--;
      signalRecovered();
    },
    (error) => errors.push(error),
    0,
  );
  queue.request();
  queue.request();
  await started;
  queue.request();
  queue.request();
  release();
  await recovered;
  assert.equal(runs, 2);
  assert.equal(errors.length, 1);
  queue.request();
  await queue.close();
  queue.request();
  await setTimeout(10);
  assert.equal(runs, 2);
});
