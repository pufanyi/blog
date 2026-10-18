import { afterRenderEffect, Directive, ElementRef, inject, input, signal } from '@angular/core';

/** Desktop positioning has its own observers and never measures headings on scroll. */
@Directive({
  selector: '[appOutlinePosition]',
  host: { '[class.is-pinned]': 'pinned()' },
})
export class OutlinePositionDirective {
  readonly outlineHost = input.required<HTMLElement>();
  readonly outlineAnchor = input.required<HTMLElement>();
  private readonly sidebar = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly pinned = signal(false);

  constructor() {
    afterRenderEffect((onCleanup) => {
      const host = this.outlineHost();
      const layout = host.parentElement;
      const anchor = this.outlineAnchor();
      if (!layout) return;
      const viewport = window.matchMedia('(min-width: 1024px)');
      let pinObserver: IntersectionObserver | null = null;
      const update = () => {
        const start = Math.max(0, host.getBoundingClientRect().top + window.scrollY);
        host.style.setProperty('--post-outline-start', `${start}px`);
        pinObserver?.disconnect();
        if (!viewport.matches || typeof IntersectionObserver === 'undefined') {
          this.pinned.set(false);
          return;
        }
        const clearance = parseFloat(getComputedStyle(this.sidebar).top);
        pinObserver = new IntersectionObserver(
          ([entry]) => {
            if (entry)
              this.pinned.set(!entry.isIntersecting && entry.boundingClientRect.top < clearance);
          },
          { rootMargin: `-${clearance}px 0px 0px 0px` },
        );
        pinObserver.observe(anchor);
      };
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
      observer?.observe(layout);
      window.addEventListener('resize', update, { passive: true });
      update();
      onCleanup(() => {
        observer?.disconnect();
        pinObserver?.disconnect();
        window.removeEventListener('resize', update);
        host.style.removeProperty('--post-outline-start');
      });
    });
  }
}
