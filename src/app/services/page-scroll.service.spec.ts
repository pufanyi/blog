import { ViewportScroller } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import {
  DefaultUrlSerializer,
  type Event,
  NavigationEnd,
  NavigationStart,
  Router,
  Scroll,
} from '@angular/router';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PageScrollService } from './page-scroll.service';

describe('PageScrollService', () => {
  let events: Subject<Event>;
  let service: PageScrollService;
  let article: HTMLElement;
  let heading: HTMLElement;
  let scrollToPosition: ReturnType<typeof vi.fn<ViewportScroller['scrollToPosition']>>;
  let getScrollPosition: ReturnType<typeof vi.fn<ViewportScroller['getScrollPosition']>>;
  let scrollIntoView: ReturnType<typeof vi.fn<HTMLElement['scrollIntoView']>>;

  function start(position?: unknown, url = window.location.href): void {
    window.history.replaceState({ navigationId: 4, custom: 'preserved' }, '');
    window.sessionStorage.setItem('blogScrollPosition', JSON.stringify({ url, position }));
    service = TestBed.inject(PageScrollService);
  }

  beforeEach(() => {
    events = new Subject<Event>();
    vi.spyOn(window.performance, 'getEntriesByType').mockReturnValue([
      { type: 'reload' } as PerformanceNavigationTiming,
    ]);
    scrollToPosition = vi.fn<ViewportScroller['scrollToPosition']>();
    getScrollPosition = vi.fn<ViewportScroller['getScrollPosition']>().mockReturnValue([0, 1350]);
    scrollIntoView = vi.fn<HTMLElement['scrollIntoView']>();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: {
            events,
            url: '/blog/example#section',
            parseUrl: (url: string) => new DefaultUrlSerializer().parse(url),
          },
        },
        {
          provide: ViewportScroller,
          useValue: { scrollToPosition, getScrollPosition, setHistoryScrollRestoration: vi.fn() },
        },
      ],
    });
    article = document.createElement('article');
    heading = document.createElement('h2');
    heading.id = 'section';
    heading.scrollIntoView = scrollIntoView;
    article.appendChild(heading);
    document.body.appendChild(article);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    window.history.replaceState(null, '');
    window.sessionStorage.clear();
    article.remove();
    events.complete();
  });

  it('restores a hydrated fragment when the router emits no initial Scroll event', () => {
    start();
    service.contentSettled(article);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' });
  });

  it('reapplies history positions after layout and resets new navigation to the top', () => {
    start();
    const navigation = new NavigationEnd(2, '/blog/example', '/blog/example');
    events.next(new Scroll(navigation, [0, 900], null));
    expect(scrollToPosition).toHaveBeenLastCalledWith([0, 900], { behavior: 'instant' });
    service.contentSettled(article);
    expect(scrollToPosition).toHaveBeenCalledTimes(2);

    const router = TestBed.inject(Router);
    Object.defineProperty(router, 'url', { value: '/blog/next' });
    events.next(new NavigationStart(3, '/blog/next'));
    events.next(new Scroll(new NavigationEnd(3, '/blog/next', '/blog/next'), null, null));
    expect(scrollToPosition).toHaveBeenLastCalledWith([0, 0], { behavior: 'instant' });
  });

  it.each(['wheel', 'touchmove'])(
    'does not override a reader who used %s during loading',
    (type) => {
      start();
      document.dispatchEvent(new window.Event(type));
      service.contentSettled(article);
      expect(scrollIntoView).not.toHaveBeenCalled();
    },
  );

  it('ignores text-input keys but respects keyboard scrolling outside an input', () => {
    start();
    const input = document.createElement('input');
    article.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    service.contentSettled(article);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    article.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    service.contentSettled(article);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('ignores content removed by another article navigation', () => {
    start();
    article.remove();
    service.contentSettled(article);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('saves the current position on pagehide without replacing router or custom state', () => {
    start();
    window.dispatchEvent(new window.Event('pagehide'));
    expect(window.history.state).toEqual({
      navigationId: 4,
      custom: 'preserved',
    });
    expect(JSON.parse(window.sessionStorage.getItem('blogScrollPosition')!)).toEqual({
      url: window.location.href,
      position: [0, 1350],
    });
  });

  it('saves when the tab becomes hidden and removes its lifecycle listeners on destroy', () => {
    start();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new window.Event('visibilitychange'));
    expect(JSON.parse(window.sessionStorage.getItem('blogScrollPosition')!).position).toEqual([
      0, 1350,
    ]);
    TestBed.resetTestingModule();
    getScrollPosition.mockClear();
    window.dispatchEvent(new window.Event('pagehide'));
    document.dispatchEvent(new window.Event('visibilitychange'));
    expect(getScrollPosition).not.toHaveBeenCalled();
  });

  it('restores the reloaded position after hydration even when the URL has an older fragment', () => {
    start([0, 2400]);
    service.contentSettled(article);
    expect(scrollToPosition).toHaveBeenLastCalledWith([0, 2400], { behavior: 'instant' });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('keeps the saved position through initial navigation and corrects deferred layout', () => {
    start([0, 2400]);
    events.next(new NavigationStart(1, '/blog/example#section'));
    events.next(
      new Scroll(new NavigationEnd(1, '/blog/example', '/blog/example'), null, 'section'),
    );
    service.contentSettled(article);
    expect(scrollToPosition).toHaveBeenCalledTimes(2);
    expect(scrollToPosition).toHaveBeenLastCalledWith([0, 2400], { behavior: 'instant' });
  });

  it('discards the reload position for subsequent article and fragment navigation', () => {
    start([0, 2400]);
    events.next(new NavigationStart(2, '/blog/example#section'));
    service.contentSettled(article);
    expect(scrollIntoView).toHaveBeenCalled();
    expect(scrollToPosition).not.toHaveBeenCalled();
  });

  it('gives router history positions precedence over the initial snapshot', () => {
    start([0, 2400]);
    events.next(new Scroll(new NavigationEnd(2, '/blog/example', '/blog/example'), [0, 900], null));
    service.contentSettled(article);
    expect(scrollToPosition).toHaveBeenLastCalledWith([0, 900], { behavior: 'instant' });
  });

  it('lets the reader interrupt a pending reload restoration', () => {
    start([0, 2400]);
    document.dispatchEvent(new window.Event('wheel'));
    service.contentSettled(article);
    expect(scrollToPosition).not.toHaveBeenCalled();
  });

  it.each([null, [0], [0, NaN], [0, Infinity], [0, '900'], [0, 900, 1]])(
    'ignores an invalid saved position %j',
    (position) => {
      start(position);
      service.contentSettled(article);
      expect(scrollIntoView).toHaveBeenCalled();
      expect(scrollToPosition).not.toHaveBeenCalled();
    },
  );

  it('ignores a saved position belonging to a different URL or fragment', () => {
    start([0, 2400], `${window.location.href}#other`);
    service.contentSettled(article);
    expect(scrollIntoView).toHaveBeenCalled();
    expect(scrollToPosition).not.toHaveBeenCalled();
  });

  it.each(['navigate', 'back_forward'])(
    'does not apply a reload snapshot to a new %s document',
    (type) => {
      vi.mocked(window.performance.getEntriesByType).mockReturnValue([
        { type } as PerformanceNavigationTiming,
      ]);
      start([0, 2400]);
      service.contentSettled(article);
      expect(scrollIntoView).toHaveBeenCalled();
      expect(scrollToPosition).not.toHaveBeenCalled();
    },
  );

  it('ignores malformed storage and continues navigating when storage is blocked', () => {
    window.sessionStorage.setItem('blogScrollPosition', '{broken');
    service = TestBed.inject(PageScrollService);
    service.contentSettled(article);
    expect(scrollIntoView).toHaveBeenCalled();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is unavailable', 'SecurityError');
    });
    window.dispatchEvent(new window.Event('pagehide'));
  });

  it('continues navigating if the browser refuses storage reads', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage is unavailable', 'SecurityError');
    });
    start();
    service.contentSettled(article);
    expect(scrollIntoView).toHaveBeenCalled();
  });
});
