import { describe, expect, it, vi } from 'vitest';
import {
  calculateReadingProgress,
  flattenToc,
  HeadingScrollSpy,
  resolveActiveHeading,
} from './heading-scroll-spy';

it('holds a deliberate destination during travel and resumes tracking after the reader moves', () => {
  let frame: FrameRequestCallback | undefined;
  let position = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frame = callback;
    return 1;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
    frame = undefined;
  });
  vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => position);
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(10_000);
  const flush = () => {
    const callback = frame;
    frame = undefined;
    callback?.(0);
  };
  const article = document.createElement('article');
  article.innerHTML = '<h2 id="one">One</h2><h2 id="two">Two</h2><h2 id="three">Three</h2>';
  document.body.append(article);
  const headings = [...article.querySelectorAll('h2')];
  for (const [index, heading] of headings.entries()) {
    vi.spyOn(heading, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    vi.spyOn(heading, 'getBoundingClientRect').mockImplementation(
      () => ({ top: (index + 1) * 400 - position }) as DOMRect,
    );
  }
  const spy = new HeadingScrollSpy();
  try {
    spy.observe(
      article,
      headings.map((heading) => ({
        id: heading.id,
        text: heading.textContent!,
        level: 2,
        children: [],
      })),
    );
    flush();
    spy.hold('three');
    position = 500;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(spy.activeHeadingId()).toBe('three');
    spy.settle();
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(spy.activeHeadingId()).toBe('three');
    position = 520;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(spy.activeHeadingId()).toBe('one');
    expect(headings[0]!.getBoundingClientRect).toHaveBeenCalledOnce();
    spy.hold('two');
    spy.settle();
    window.dispatchEvent(new Event('resize'));
    flush();
    expect(spy.activeHeadingId()).toBe('one');
  } finally {
    spy.disconnect();
    article.remove();
    vi.restoreAllMocks();
  }
});

it('caches geometry during scrolling, invalidates on layout events and disconnects', () => {
  let frame: FrameRequestCallback | undefined;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frame = callback;
    return 1;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
    frame = undefined;
  });
  const flush = () => {
    const callback = frame;
    frame = undefined;
    callback?.(0);
  };
  const article = document.createElement('article');
  article.innerHTML = '<h2 id="one">One</h2>';
  document.body.append(article);
  const heading = article.querySelector('h2')!;
  vi.spyOn(heading, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
  const rect = vi.spyOn(heading, 'getBoundingClientRect');
  const spy = new HeadingScrollSpy();
  try {
    spy.observe(article, [{ id: 'one', text: 'One', level: 2, children: [] }]);
    flush();
    expect(rect).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(rect).toHaveBeenCalledTimes(1);
    article.dispatchEvent(new Event('toggle'));
    flush();
    expect(rect).toHaveBeenCalledTimes(2);
    window.dispatchEvent(new Event('resize'));
    flush();
    expect(rect).toHaveBeenCalledTimes(3);
    spy.disconnect();
    article.dispatchEvent(new Event('load'));
    window.dispatchEvent(new Event('scroll'));
    expect(frame).toBeUndefined();
  } finally {
    spy.disconnect();
    article.remove();
    vi.restoreAllMocks();
  }
});

describe('resolveActiveHeading', () => {
  const headings = [
    { id: 'one', top: 160 },
    { id: 'two', top: 480 },
    { id: 'three', top: 900 },
  ];

  it('has no active section before the first heading reaches the activation line', () => {
    expect(resolveActiveHeading(headings, 80, false)).toBe('');
  });

  it('chooses the last heading above the activation line', () => {
    expect(
      resolveActiveHeading(
        [
          { id: 'one', top: -220 },
          { id: 'two', top: 40 },
          { id: 'three', top: 400 },
        ],
        80,
        false,
      ),
    ).toBe('two');
  });

  it('activates the final section at the bottom of the page', () => {
    expect(resolveActiveHeading(headings, 80, true)).toBe('three');
  });
});

describe('calculateReadingProgress', () => {
  it('clamps progress before and after the readable article range', () => {
    expect(calculateReadingProgress(200, 1200, 600, 80)).toBe(0);
    expect(calculateReadingProgress(-600, 1200, 600, 80)).toBe(1);
  });

  it('reports progress within the article', () => {
    expect(calculateReadingProgress(-260, 1200, 600, 80)).toBe(0.5);
  });
});

describe('flattenToc', () => {
  it('preserves document order', () => {
    expect(
      flattenToc([
        {
          id: 'one',
          text: 'One',
          level: 2,
          children: [{ id: 'one-a', text: 'One A', level: 3, children: [] }],
        },
        { id: 'two', text: 'Two', level: 2, children: [] },
      ]).map((item) => item.id),
    ).toEqual(['one', 'one-a', 'two']);
  });
});
