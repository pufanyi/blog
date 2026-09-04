import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundComponent } from './not-found';

describe('NotFoundComponent', () => {
  const mathJaxWindow = window as typeof window & {
    MathJax?: {
      startup: { promise: Promise<unknown> };
      typesetPromise: ReturnType<typeof vi.fn>;
    };
  };
  let typesetPromise: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    typesetPromise = vi.fn().mockResolvedValue(undefined);
    mathJaxWindow.MathJax = {
      startup: { promise: Promise.resolve() },
      typesetPromise,
    };
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    delete mathJaxWindow.MathJax;
  });

  it('keeps the title accessible while showing one typeset proof card', async () => {
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
    expect(element.querySelectorAll('.math-symbol')).toHaveLength(2);
    expect(pageText).toContain('\\(\\mathfrak{P}\\)');
    expect(pageText).toContain('\\(\\zeta\\)');
    await vi.waitFor(() => expect(typesetPromise).toHaveBeenCalledWith([element]));
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
