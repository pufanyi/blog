import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NOT_FOUND_RANDOM,
  NotFoundComponent,
  selectNotFoundScenario,
} from './not-found';

describe('NotFoundComponent', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'MathJax', {
      configurable: true,
      value: {
        startup: { promise: Promise.resolve() },
        typesetPromise: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'MathJax');
  });

  async function renderScenario(randomValue: number) {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [
        provideRouter([]),
        { provide: NOT_FOUND_RANDOM, useValue: () => randomValue },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('selects both scenarios with equal halves of the random range', () => {
    expect(selectNotFoundScenario(0).id).toBe('halting');
    expect(selectNotFoundScenario(0.49).id).toBe('halting');
    expect(selectNotFoundScenario(0.5).id).toBe('exercise');
    expect(selectNotFoundScenario(0.99).id).toBe('exercise');
  });

  it('starts the heat-death countdown from ten billion years', async () => {
    const fixture = await renderScenario(0);
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('404: The Halting Problem');
    expect(element.querySelector('.process-stats')?.textContent).toContain('UNDECIDABLE');

    element.querySelector<HTMLButtonElement>('.secondary-action')?.click();
    fixture.detectChanges();

    expect(element.querySelector('.heat-death-overlay')).not.toBeNull();
    expect(element.querySelector('.cosmic-timer')?.textContent).toContain('10,000,000,000');
    fixture.destroy();
  });

  it('rejects the exercise scenario submission in peer review', async () => {
    const fixture = await renderScenario(0.99);
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain(
      '404: Existence Left as an Exercise',
    );

    const form = element.querySelector<HTMLFormElement>('.interaction-panel');
    if (!form) throw new Error('Paper submission form was not rendered');

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"]')?.textContent).toContain('Reviewer #2');
    expect(element.querySelector('.verdict')?.textContent).toContain('Reject');
  });
});
