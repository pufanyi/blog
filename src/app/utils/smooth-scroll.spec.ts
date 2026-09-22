import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { smoothScrollTo } from './smooth-scroll';

describe('smoothScrollTo', () => {
  let frame: FrameRequestCallback | undefined;
  beforeEach(() => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    vi.spyOn(performance, 'now').mockReturnValue(0);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frame = callback;
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
      frame = undefined;
    });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    frame = undefined;
  });

  it('writes immediate animation frames and completes exactly at the target', () => {
    const complete = vi.fn();
    smoothScrollTo(600, 400, complete);
    frame?.(200);
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 300, behavior: 'instant' });
    expect(complete).not.toHaveBeenCalled();
    frame?.(400);
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 600, behavior: 'instant' });
    expect(complete).toHaveBeenCalledOnce();
  });

  it('cancels without moving or completing afterward', () => {
    const complete = vi.fn();
    const handle = smoothScrollTo(600, 400, complete);
    handle.cancel();
    expect(frame).toBeUndefined();
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    'uses a direct jump for reduced motion (%s) or zero duration',
    (reduce) => {
      vi.stubGlobal('matchMedia', () => ({ matches: reduce }));
      const complete = vi.fn();
      smoothScrollTo(600, reduce ? 400 : 0, complete);
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 600, behavior: 'instant' });
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
      expect(complete).toHaveBeenCalledOnce();
    },
  );
});
