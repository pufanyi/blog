export interface SmoothScrollHandle {
  cancel(): void;
}

const DEFAULT_DURATION_MS = 420;

export function smoothScrollTo(
  targetY: number,
  durationMs = DEFAULT_DURATION_MS,
  onComplete?: () => void,
): SmoothScrollHandle {
  if (typeof window === 'undefined') {
    return { cancel: () => undefined };
  }

  const startY = window.scrollY;
  const deltaY = targetY - startY;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (Math.abs(deltaY) < 1 || reduceMotion || durationMs <= 0) {
    window.scrollTo({ top: targetY, behavior: 'instant' });
    onComplete?.();
    return { cancel: () => undefined };
  }

  let frameId: number | null = null;
  const startTime = performance.now();

  const easeInOutCubic = (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const tick = (now: number): void => {
    const progress = Math.min((now - startTime) / durationMs, 1);
    const eased = easeInOutCubic(progress);
    // The document has smooth scrolling enabled for native links. Each frame
    // here must be immediate, not start another browser-owned animation.
    window.scrollTo({ top: startY + deltaY * eased, behavior: 'instant' });

    if (progress < 1) {
      frameId = window.requestAnimationFrame(tick);
    } else {
      frameId = null;
      onComplete?.();
    }
  };

  frameId = window.requestAnimationFrame(tick);

  return {
    cancel() {
      if (frameId !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
    },
  };
}
