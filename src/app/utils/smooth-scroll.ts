export interface SmoothScrollHandle {
  cancel(): void;
}

const DEFAULT_DURATION_MS = 420;

export function smoothScrollTo(targetY: number, durationMs = DEFAULT_DURATION_MS): SmoothScrollHandle {
  if (typeof window === 'undefined') {
    return { cancel() {} };
  }

  const startY = window.scrollY;
  const deltaY = targetY - startY;

  if (Math.abs(deltaY) < 1) {
    window.scrollTo(0, targetY);
    return { cancel() {} };
  }

  let frameId: number | null = null;
  const startTime = performance.now();

  const easeInOutCubic = (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const tick = (now: number): void => {
    const progress = Math.min((now - startTime) / durationMs, 1);
    const eased = easeInOutCubic(progress);
    window.scrollTo(0, startY + deltaY * eased);

    if (progress < 1) {
      frameId = window.requestAnimationFrame(tick);
    } else {
      frameId = null;
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
