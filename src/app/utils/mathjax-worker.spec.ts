import { afterEach, expect, it, vi } from 'vitest';
import { createMathWorker } from './mathjax-worker';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

for (const completion of ['message', 'error', 'terminate'] as const) {
  it(`retains the worker URL until ${completion} and releases it only once`, async () => {
    class FakeWorker extends EventTarget {
      onmessage: unknown;
      terminate = vi.fn();
    }
    const fake = new FakeWorker();
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          return fake;
        }
      },
    );
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mathjax-worker');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const listener = vi.fn();
    const worker = await createMathWorker(listener, {
      path: 'https://example.org/sre',
      maps: 'https://example.org/maps',
      worker: 'speech-worker.js',
    });
    expect(revoke).not.toHaveBeenCalled();
    expect(worker.onmessage).toBe(listener);
    if (completion === 'terminate') worker.terminate();
    else fake.dispatchEvent(new Event(completion));
    expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:mathjax-worker');
    fake.dispatchEvent(new Event('message'));
    worker.terminate();
    expect(revoke).toHaveBeenCalledTimes(1);
  });
}

it('releases the URL if construction fails', async () => {
  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        throw new Error('Worker blocked');
      }
    },
  );
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:blocked');
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  await expect(
    createMathWorker(() => undefined, { path: '/sre', maps: '/maps', worker: 'worker.js' }),
  ).rejects.toThrow('Worker blocked');
  expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:blocked');
});
