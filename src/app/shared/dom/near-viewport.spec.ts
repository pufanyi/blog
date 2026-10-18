import { afterEach, expect, it, vi } from 'vitest';
import { whenNearViewport } from './near-viewport';

afterEach(() => vi.unstubAllGlobals());

it('starts once and ignores queued observer deliveries after disposal', () => {
  let deliver!: IntersectionObserverCallback;
  const disconnect = vi.fn();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        deliver = callback;
      }
      observe = vi.fn();
      disconnect = disconnect;
    },
  );
  const action = vi.fn();
  const entries = [{ isIntersecting: true }] as IntersectionObserverEntry[];
  const stop = whenNearViewport(document.createElement('div'), action);
  deliver(entries, {} as IntersectionObserver);
  deliver(entries, {} as IntersectionObserver);
  expect(action).toHaveBeenCalledTimes(1);
  stop();
  const canceled = vi.fn();
  whenNearViewport(document.createElement('div'), canceled)();
  deliver(entries, {} as IntersectionObserver);
  expect(canceled).not.toHaveBeenCalled();
  expect(disconnect).toHaveBeenCalled();
});
