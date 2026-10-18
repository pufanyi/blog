import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CvPageComponent } from './cv';

describe('CvPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });
  it('keeps the website link on the full CV page', () => {
    const fixture = TestBed.createComponent(CvPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector<HTMLAnchorElement>('.icon-link[href="https://pufanyi.com"]')?.ariaLabel,
    ).toBe('Homepage');
    expect(element.querySelector('.icon-link[href="/cv"]')).toBeNull();
  });
});
