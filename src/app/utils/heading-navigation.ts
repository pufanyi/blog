import type { HeadingScrollSpy } from './heading-scroll-spy';
import { type SmoothScrollHandle, smoothScrollTo } from './smooth-scroll';

export interface HeadingSelection {
  id: string;
  event: MouseEvent;
  ready?: Promise<void>;
}

// Own only deliberate TOC jumps. Native links, initial fragments and history
// restoration keep their existing browser/router behavior.
export class HeadingNavigation {
  private pending: AbortController | null = null;
  private scroll: SmoothScrollHandle | null = null;
  private arrival: Animation | null = null;

  constructor(
    private readonly article: HTMLElement,
    private readonly spy: HeadingScrollSpy,
    private readonly commitFragment: (id: string) => Promise<boolean>,
  ) {}

  select({ id, event, ready }: HeadingSelection): void {
    const heading = this.article.ownerDocument.getElementById(id);
    if (!heading || !this.article.contains(heading) || !heading.matches('h2, h3')) return;
    event.preventDefault();
    this.cancel();
    const pending = new AbortController();
    this.pending = pending;
    this.spy.hold(id);
    this.article.dataset['tocNavigating'] = id;
    const options = { signal: pending.signal, passive: true };
    const doc = this.article.ownerDocument;
    for (const type of ['wheel', 'touchstart', 'pointerdown']) {
      doc.addEventListener(type, this.cancel, options);
    }
    doc.addEventListener('keydown', this.onKey, options);
    for (const type of ['popstate', 'hashchange', 'resize']) {
      window.addEventListener(type, this.cancel, options);
    }

    // Let the router capture the outgoing reading position before we move.
    // Its manual-scroll navigation also prevents a second fragment jump.
    void this.commitFragment(id).then(
      async (committed) => {
        if (ready) await ready;
        if (pending.signal.aborted) return;
        if (!committed || !heading.isConnected) {
          this.cancel();
          return;
        }
        // Native fragment navigation reveals ancestor disclosures. Preserve that
        // behavior before measuring an enhanced jump, including nested details.
        for (
          let parent = heading.parentElement;
          parent && parent !== this.article;
          parent = parent.parentElement
        ) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
        }
        const margin = Number.parseFloat(getComputedStyle(heading).scrollMarginTop) || 0;
        const maxY = Math.max(0, doc.documentElement.scrollHeight - window.innerHeight);
        const targetY = Math.min(
          maxY,
          Math.max(0, heading.getBoundingClientRect().top + window.scrollY - margin),
        );
        const distance = Math.abs(targetY - window.scrollY);
        // Long articles should not fly past dozens of unrelated chapters.
        // The arrival cue supplies orientation for those direct jumps.
        const duration = distance > window.innerHeight * 3 ? 0 : 260 + Math.min(180, distance / 4);
        const scroll = smoothScrollTo(targetY, duration, () => {
          if (pending.signal.aborted) return;
          pending.abort();
          this.pending = null;
          this.scroll = null;
          delete this.article.dataset['tocNavigating'];
          this.spy.settle();
          heading.focus({ preventScroll: true });
          if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && heading.animate) {
            this.arrival = heading.animate(
              [
                { backgroundColor: 'var(--accent-bg)', boxShadow: '0 0 0 6px var(--accent-bg)' },
                { backgroundColor: 'transparent', boxShadow: '0 0 0 6px transparent' },
              ],
              { duration: 900, easing: 'ease-out' },
            );
          }
        });
        this.scroll = pending.signal.aborted ? null : scroll;
      },
      () => {
        if (!pending.signal.aborted) this.cancel();
      },
    );
  }

  readonly cancel = (): void => {
    this.pending?.abort();
    this.pending = null;
    this.scroll?.cancel();
    this.scroll = null;
    this.arrival?.cancel();
    this.arrival = null;
    delete this.article.dataset['tocNavigating'];
    this.spy.release();
  };

  private readonly onKey = (event: KeyboardEvent): void => {
    if (
      ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Tab', 'Escape'].includes(
        event.key,
      )
    ) {
      this.cancel();
    }
  };
}
