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

    const dialog = element.querySelector<HTMLDialogElement>('dialog.review-dialog');
    expect(dialog?.hasAttribute('open')).toBe(true);
    expect(dialog?.textContent).toContain('Reviewer #2');
    expect(element.querySelector('.verdict')?.textContent).toContain('Reject');

    element.querySelector('.verdict')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(dialog?.hasAttribute('open')).toBe(true);
  });

  it.each(['button', 'backdrop', 'escape'])('dismisses peer review with %s', async (method) => {
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const submitButton = element.querySelector<HTMLButtonElement>('.submission-actions button');
    submitButton?.focus();
    submitButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = element.querySelector<HTMLDialogElement>('dialog.review-dialog');
    const closeButton = element.querySelector<HTMLButtonElement>('.review-dialog button');
    expect(document.activeElement).toBe(closeButton);

    if (method === 'button') {
      closeButton?.click();
    } else if (method === 'backdrop') {
      dialog?.click();
    } else {
      dialog?.dispatchEvent(new Event('cancel', { cancelable: true }));
    }
    fixture.detectChanges();

    expect(dialog?.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(submitButton);
  });
});
