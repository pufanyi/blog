import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundComponent } from './not-found';

describe('NotFoundComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the exercise theorem without raw TeX or an unnecessary input', () => {
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const heading = element.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim();
    const pageText = element.textContent ?? '';

    expect(heading).toBe('404: Existence Left as an Exercise');
    expect(element.querySelectorAll('var')).toHaveLength(2);
    expect(pageText).not.toContain('\\(');
    expect(element.querySelector('input')).toBeNull();
    expect(element.querySelector<HTMLAnchorElement>('.secondary-action')?.getAttribute('href')).toBe(
      '/',
    );
  });

  it('rejects a proof submission in peer review', () => {
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.submission-actions .primary-action')?.click();
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"]')?.textContent).toContain('Reviewer #2');
    expect(element.querySelector('.verdict')?.textContent).toContain('Reject');
  });
});
