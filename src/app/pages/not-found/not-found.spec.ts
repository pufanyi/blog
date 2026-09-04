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

  it('keeps the title accessible while showing one uncluttered proof card', () => {
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const heading = element.querySelector('h1');
    const pageText = element.textContent ?? '';

    expect(heading?.textContent).toBe('404: Existence Left as an Exercise');
    expect(heading?.classList.contains('visually-hidden')).toBe(true);
    expect(element.querySelectorAll('.proof-sheet')).toHaveLength(1);
    expect(element.querySelector('.proof-rule')).toBeNull();
    expect(element.querySelector('.proof-footer')).toBeNull();
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
