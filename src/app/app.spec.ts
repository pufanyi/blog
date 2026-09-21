import { TestBed } from '@angular/core/testing';
import {
  type Event,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  provideRouter,
  Router,
} from '@angular/router';
import { Subject } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './app';
import { PageScrollService } from './services/page-scroll.service';

describe('navigation feedback', () => {
  afterEach(() => TestBed.resetTestingModule());

  async function setup() {
    const events = new Subject<Event>();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: PageScrollService, useValue: {} }],
    });
    const router = TestBed.inject(Router);
    Object.defineProperty(router, 'events', { value: events });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const emit = async (event: Event) => {
      events.next(event);
      await fixture.whenStable();
    };
    return { fixture, element, emit };
  }

  it.each([
    new NavigationEnd(2, '/blog', '/blog'),
    new NavigationCancel(2, '/blog', 'Guard rejected navigation'),
    new NavigationSkipped(2, '/blog', 'Same URL'),
  ])('clears loading on $constructor.name', async (end) => {
    const { element, emit } = await setup();
    expect(element.querySelector('[role="status"]')).toBeNull();
    await emit(new NavigationStart(2, '/blog'));
    expect(element.querySelector('.navigation-progress')).not.toBeNull();
    expect(element.querySelector('[role="status"]')).toBeNull();
    await emit(end);
    expect(element.querySelector('.navigation-progress')).toBeNull();
    expect(element.querySelector('[role="status"]')).toBeNull();
  });

  it('keeps the newest navigation loading when an older request finishes', async () => {
    const { element, emit } = await setup();
    await emit(new NavigationStart(2, '/blog'));
    await emit(new NavigationStart(3, '/docs'));
    await emit(new NavigationCancel(2, '/blog', 'Superseded'));
    expect(element.querySelector('.navigation-progress')).not.toBeNull();
    await emit(new NavigationEnd(3, '/docs', '/docs'));
    expect(element.querySelector('.navigation-progress')).toBeNull();
  });

  it('offers a full document retry of the failed destination and clears it on navigation', async () => {
    const { element, emit } = await setup();
    const url = '/blog/example?view=full#section';
    await emit(new NavigationStart(2, url));
    await emit(new NavigationError(2, url, new Error('Network failure')));
    expect(element.textContent).toContain('页面加载失败');
    expect(element.querySelector('a')?.getAttribute('href')).toBe(url);
    expect(element.querySelector('.navigation-progress')).toBeNull();
    await emit(new NavigationStart(3, '/docs'));
    expect(element.querySelector('a')).toBeNull();
    expect(element.querySelector('.navigation-progress')).not.toBeNull();
  });

  it('lets readers dismiss failures', async () => {
    const { fixture, element, emit } = await setup();
    await emit(new NavigationStart(2, '/blog'));
    await emit(new NavigationError(2, '/blog', new Error('Network failure')));
    element.querySelector('button')?.click();
    await fixture.whenStable();
    expect(element.querySelector('[role="status"]')).toBeNull();
  });
});
