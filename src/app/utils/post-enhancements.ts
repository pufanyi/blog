import type { PostEnhancementLoader } from '../models/post-enhancement.model';
import { whenNearViewport } from './near-viewport';

/** Keep authored static content usable when a client enhancement fails to load. */
export function bindPostEnhancements(
  container: HTMLElement,
  loaders: readonly PostEnhancementLoader[],
  reportError: (error: unknown) => void = (error) =>
    console.error('Post enhancement failed', error),
): () => void {
  let disposed = false;
  const cleanups: (() => void)[] = [];
  for (const load of loaders) {
    let started = false;
    const observers: (() => void)[] = [];
    const start = () => {
      if (started || disposed) return;
      started = true;
      for (const stop of observers) stop();
      void Promise.resolve()
        .then(load)
        .then((module) => {
          if (disposed || !container.isConnected) return;
          cleanups.push(module.enhancePost(container));
        })
        .catch((error: unknown) => {
          if (!disposed) reportError(error);
        });
    };
    const targets = load.target
      ? [...container.querySelectorAll<HTMLElement>('[data-post-enhancement]')].filter((element) =>
          element.dataset['postEnhancement']?.split(/\s+/).includes(load.target!),
        )
      : [];
    if (!targets.length) start();
    for (const target of targets) {
      observers.push(whenNearViewport(target, start));
      target.addEventListener('focusin', start);
      target.addEventListener('pointerdown', start);
      cleanups.push(() => {
        target.removeEventListener('focusin', start);
        target.removeEventListener('pointerdown', start);
      });
    }
    cleanups.push(() => observers.forEach((stop) => stop()));
  }
  return () => {
    if (disposed) return;
    disposed = true;
    for (const cleanup of cleanups.reverse()) {
      try {
        cleanup();
      } catch (error) {
        reportError(error);
      }
    }
  };
}
