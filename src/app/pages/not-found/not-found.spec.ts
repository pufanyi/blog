import { InteractivityChecker } from '@angular/cdk/a11y';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundComponent } from './not-found';

describe('NotFoundComponent', () => {
  let typesetPromise: ReturnType<typeof vi.fn<(elements: HTMLElement[]) => Promise<void>>>;

  beforeEach(async () => {
    typesetPromise = vi
      .fn<(elements: HTMLElement[]) => Promise<void>>()
      .mockResolvedValue(undefined);
    window.MathJax = {
      startup: { promise: Promise.resolve() },
      typesetPromise,
    };
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    // JSDOM has no layout, so CDK cannot measure the visible dialog button.
    vi.spyOn(TestBed.inject(InteractivityChecker), 'isFocusable').mockImplementation(
      element => element instanceof HTMLButtonElement,
    );
  });

  afterEach(() => {
    delete window.MathJax;
    vi.restoreAllMocks();
  });

  it('keeps the accessible title, typeset proof and recovery link', async () => {
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const heading = element.querySelector('h1');
    const pageText = element.textContent ?? '';

    expect(heading?.textContent).toBe('404: Existence Left as an Exercise');
    expect(element.querySelectorAll('.proof-sheet')).toHaveLength(1);
    expect(element.querySelectorAll('.math-symbol')).toHaveLength(2);
    expect(pageText).toContain('\\(\\mathfrak{P}\\)');
    expect(pageText).toContain('\\(\\zeta\\)');
    await vi.waitFor(() => expect(typesetPromise).toHaveBeenCalledWith([element]));
    expect(element.querySelector('input')).toBeNull();
    expect(
      element.querySelector<HTMLAnchorElement>('.secondary-action')?.getAttribute('href'),
    ).toBe('/');
  });

  it('rejects a proof submission in peer review', () => {
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.submission-actions button')?.click();
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"]')?.textContent).toContain('Reviewer #2');
    expect(element.querySelector('.verdict')?.textContent).toContain('Reject');

    element.querySelector<HTMLElement>('.review-dialog')?.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it.each(['button', 'backdrop', 'escape'])('dismisses peer review with %s', async method => {
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const submitButton = element.querySelector<HTMLButtonElement>('.submission-actions button');
    submitButton?.focus();
    submitButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const closeButton = element.querySelector<HTMLButtonElement>('.review-dialog button');
    expect(document.activeElement).toBe(closeButton);

    if (method === 'button') {
      closeButton?.click();
    } else if (method === 'backdrop') {
      element.querySelector<HTMLElement>('.review-backdrop')?.click();
    } else {
      closeButton?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(submitButton);
  });
});
