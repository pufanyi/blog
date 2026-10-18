import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeadingNavigation } from './heading-navigation';
import { HeadingScrollSpy } from './heading-scroll-spy';

describe('HeadingNavigation', () => {
  let article: HTMLElement;
  let heading: HTMLElement;
  let spy: HeadingScrollSpy;
  let navigation: HeadingNavigation;
  let commit: ReturnType<typeof vi.fn<(id: string) => Promise<boolean>>>;
  let frame: FrameRequestCallback | undefined;
  let position: number;
  const click = (id = 'section') => {
    const event = new MouseEvent('click', { cancelable: true });
    navigation.select({ id, event });
    return event;
  };

  beforeEach(() => {
    article = document.createElement('article');
    article.innerHTML = '<h2 id="section" tabindex="-1">Section</h2>';
    heading = article.firstElementChild as HTMLElement;
    document.body.append(article);
    position = 0;
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => position);
    vi.spyOn(window, 'scrollTo').mockImplementation((options) => {
      position = (options as ScrollToOptions).top ?? 0;
    });
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(20_000);
    vi.spyOn(heading, 'getBoundingClientRect').mockReturnValue({ top: 600 } as DOMRect);
    vi.spyOn(performance, 'now').mockReturnValue(0);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frame = callback;
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
      frame = undefined;
    });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    spy = new HeadingScrollSpy();
    vi.spyOn(spy, 'hold').mockImplementation(() => undefined);
    vi.spyOn(spy, 'settle').mockImplementation(() => undefined);
    vi.spyOn(spy, 'release').mockImplementation(() => undefined);
    commit = vi.fn().mockResolvedValue(true);
    navigation = new HeadingNavigation(article, spy, commit);
  });
  afterEach(() => {
    navigation.cancel();
    article.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    frame = undefined;
  });

  it('commits history before moving, pins selection and focuses only on arrival', async () => {
    expect(click().defaultPrevented).toBe(true);
    expect(commit).toHaveBeenCalledWith('section');
    expect(spy.hold).toHaveBeenCalledWith('section');
    expect(window.scrollTo).not.toHaveBeenCalled();
    await Promise.resolve();
    frame?.(100);
    expect(document.activeElement).not.toBe(heading);
    frame?.(500);
    expect(document.activeElement).toBe(heading);
    expect(spy.settle).toHaveBeenCalledOnce();
    expect(article.dataset['tocNavigating']).toBeUndefined();
  });

  it('keeps missing or outside-article targets native', () => {
    const other = document.createElement('h2');
    other.id = 'outside';
    document.body.append(other);
    try {
      expect(click('missing').defaultPrevented).toBe(false);
      expect(click('outside').defaultPrevented).toBe(false);
      expect(commit).not.toHaveBeenCalled();
    } finally {
      other.remove();
    }
  });

  it('waits for the mobile sheet to leave before moving or focusing the article', async () => {
    let close: (() => void) | undefined;
    const ready = new Promise<void>((resolve) => {
      close = resolve;
    });
    navigation.select({
      id: 'section',
      event: new MouseEvent('click', { cancelable: true }),
      ready,
    });
    await Promise.resolve();
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(heading);
    close?.();
    await Promise.resolve();
    frame?.(500);
    expect(document.activeElement).toBe(heading);
  });

  it('reveals nested disclosures before positioning their heading', async () => {
    const outer = document.createElement('details');
    const inner = document.createElement('details');
    article.append(outer);
    outer.append(inner);
    inner.append(heading);
    click();
    await Promise.resolve();
    expect(outer.open).toBe(true);
    expect(inner.open).toBe(true);
  });

  it.each(['wheel', 'touchstart', 'pointerdown'])(
    'lets %s interrupt without late focus or scrolling',
    async (type) => {
      click();
      await Promise.resolve();
      document.dispatchEvent(new Event(type));
      expect(article.dataset['tocNavigating']).toBeUndefined();
      expect(frame).toBeUndefined();
      expect(spy.settle).not.toHaveBeenCalled();
      expect(document.activeElement).not.toBe(heading);
    },
  );

  it.each(['Tab', 'PageDown', 'Escape'])('releases the pending target for %s', async (key) => {
    click();
    await Promise.resolve();
    document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    expect(article.dataset['tocNavigating']).toBeUndefined();
    expect(document.activeElement).not.toBe(heading);
  });

  it('ignores late completion after cleanup or a newer selection', async () => {
    let finish: ((value: boolean) => void) | undefined;
    commit.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    click();
    navigation.cancel();
    finish?.(true);
    await Promise.resolve();
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(heading);
  });

  it('does not scroll after the router refuses navigation', async () => {
    commit.mockResolvedValue(false);
    click();
    await Promise.resolve();
    expect(article.dataset['tocNavigating']).toBeUndefined();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('jumps directly across a long article instead of racing through intermediate chapters', async () => {
    vi.spyOn(heading, 'getBoundingClientRect').mockReturnValue({ top: 10_000 } as DOMRect);
    click();
    await Promise.resolve();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 10_000, behavior: 'instant' });
    expect(document.activeElement).toBe(heading);
  });
});
