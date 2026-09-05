import { ViewportScroller } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import {
  DefaultUrlSerializer,
  NavigationEnd,
  NavigationStart,
  Router,
  Scroll,
  type Event,
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
  let scrollIntoView: ReturnType<typeof vi.fn<HTMLElement['scrollIntoView']>>;

  beforeEach(() => {
    events = new Subject<Event>();
    scrollToPosition = vi.fn<ViewportScroller['scrollToPosition']>();
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
          useValue: { scrollToPosition, setHistoryScrollRestoration: vi.fn() },
        },
      ],
    });
    article = document.createElement('article');
    heading = document.createElement('h2');
    heading.id = 'section';
    heading.scrollIntoView = scrollIntoView;
    article.appendChild(heading);
    document.body.appendChild(article);
    service = TestBed.inject(PageScrollService);
  });

  afterEach(() => {
    article.remove();
    events.complete();
  });

  it('restores a hydrated fragment when the router emits no initial Scroll event', () => {
    service.contentSettled(article);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' });
  });

  it('reapplies history positions after layout and resets new navigation to the top', () => {
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

  it.each(['wheel', 'touchmove'])('does not override a reader who used %s during loading', type => {
    document.dispatchEvent(new window.Event(type));
    service.contentSettled(article);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('ignores text-input keys but respects keyboard scrolling outside an input', () => {
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
    article.remove();
    service.contentSettled(article);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
