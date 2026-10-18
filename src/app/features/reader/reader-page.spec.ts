import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, expect, it } from 'vitest';
import { PageChromeService } from '../../platform/page-chrome.service';
import { ReaderPageComponent } from './reader-page';

afterEach(() => {
  delete window.MathJax;
});

it('does not advertise reading controls when article resolution returns the missing-page fallback', async () => {
  await TestBed.configureTestingModule({
    imports: [ReaderPageComponent],
    providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { data: of({ post: null }) } },
    ],
  }).compileComponents();
  window.MathJax = {
    startup: { promise: Promise.resolve() },
    typesetPromise: async () => undefined,
  };
  const fixture = TestBed.createComponent(ReaderPageComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  const chrome = TestBed.inject(PageChromeService);
  expect(fixture.nativeElement.querySelector('app-not-found')).not.toBeNull();
  expect(chrome.title()).toBe('');
  expect(chrome.actions()).toEqual([]);
  expect(chrome.readingDock()).toBe(false);
});
