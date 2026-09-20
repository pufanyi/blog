import { expect, it, vi } from 'vitest';
import { bindPostEnhancements } from './post-enhancements';

it('defers a marked controller until interaction and releases it on navigation', async () => {
  const disconnect = vi.fn();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = vi.fn();
      disconnect = disconnect;
    },
  );
  const container = document.createElement('article');
  container.innerHTML = '<div data-post-enhancement="forward"></div>';
  document.body.append(container);
  const dispose = vi.fn();
  const enhancePost = vi.fn(() => dispose);
  const load = Object.assign(
    vi.fn(async () => ({ enhancePost })),
    { target: 'forward' },
  );
  const cleanup = bindPostEnhancements(container, [load]);
  try {
    await Promise.resolve();
    expect(load).not.toHaveBeenCalled();
    container.firstElementChild!.dispatchEvent(new Event('focusin'));
    await vi.waitFor(() => expect(enhancePost).toHaveBeenCalledWith(container));
    expect(load).toHaveBeenCalledTimes(1);
    cleanup();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalled();
  } finally {
    cleanup();
    container.remove();
    vi.unstubAllGlobals();
  }
});

it('ignores a controller import that completes after navigation', async () => {
  const container = document.createElement('article');
  document.body.append(container);
  const enhancePost = vi.fn(() => () => undefined);
  let complete!: (module: { enhancePost: typeof enhancePost }) => void;
  const load = () =>
    new Promise<{ enhancePost: typeof enhancePost }>((resolve) => {
      complete = resolve;
    });
  const cleanup = bindPostEnhancements(container, [load]);
  await Promise.resolve();
  cleanup();
  complete({ enhancePost });
  await Promise.resolve();
  await Promise.resolve();
  expect(enhancePost).not.toHaveBeenCalled();
  container.remove();
});
