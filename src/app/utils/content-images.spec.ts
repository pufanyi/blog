import { ApplicationRef, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expect, it } from 'vitest';
import { hydrateContentImages } from './content-images';

it('hydrates dimensioned images and releases their Angular views on navigation', () => {
  const app = TestBed.inject(ApplicationRef);
  const before = app.viewCount;
  const container = document.createElement('div');
  container.innerHTML =
    '<img src="/dimensioned.avif" width="80" height="40" alt="A diagram"><img src="/unknown.avif" alt="Unknown dimensions">';
  document.body.appendChild(container);
  const dispose = hydrateContentImages(container, TestBed.inject(EnvironmentInjector), app);
  try {
    expect(app.viewCount).toBe(before + 1);
    expect(container.querySelector('app-image-lightbox img')?.getAttribute('alt')).toBe(
      'A diagram',
    );
    expect(container.querySelector(':scope > img')?.getAttribute('src')).toBe('/unknown.avif');
  } finally {
    dispose();
    container.remove();
  }
  expect(app.viewCount).toBe(before);
});
