import type { PostEnhancementLoader } from '../models/post-enhancement.model';

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
    void Promise.resolve()
      .then(load)
      .then((module) => {
        if (disposed || !container.isConnected) return;
        cleanups.push(module.enhancePost(container));
      })
      .catch((error: unknown) => {
        if (!disposed) reportError(error);
      });
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
