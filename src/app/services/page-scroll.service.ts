import { DOCUMENT, ViewportScroller } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, Scroll } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class PageScrollService {
  private readonly router = inject(Router);
  private readonly viewport = inject(ViewportScroller);
  private readonly document = inject(DOCUMENT);
  private lastScroll: Scroll | null = null;
  private userScrolled = false;

  constructor() {
    this.viewport.setHistoryScrollRestoration('manual');
    this.router.events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.lastScroll = null;
        this.userScrolled = false;
      } else if (event instanceof Scroll) {
        this.lastScroll = event;
        this.restore();
      }
    });
    const onPointerScroll = () => {
      this.userScrolled = true;
    };
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, [contenteditable="true"]')
      )
        return;
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key))
        onPointerScroll();
    };
    this.document.addEventListener('wheel', onPointerScroll, { passive: true });
    this.document.addEventListener('touchmove', onPointerScroll, { passive: true });
    this.document.addEventListener('keydown', onKey);
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('wheel', onPointerScroll);
      this.document.removeEventListener('touchmove', onPointerScroll);
      this.document.removeEventListener('keydown', onKey);
    });
  }

  // Hydration can suppress the router's initial Scroll event. The URL fragment
  // still needs restoring after fonts and formulas change the document height.
  contentSettled(container: HTMLElement): void {
    if (container.isConnected) this.restore(container);
  }

  private restore(container?: HTMLElement): void {
    const scroll = this.lastScroll;
    if (this.userScrolled || scroll?.scrollBehavior === 'manual') return;
    if (scroll?.position) {
      this.viewport.scrollToPosition(scroll.position, { behavior: 'instant' });
      return;
    }
    const anchor = scroll?.anchor ?? this.router.parseUrl(this.router.url).fragment;
    if (anchor) {
      const target = this.document.getElementById(anchor);
      if (target && (!container || container.contains(target)))
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else if (scroll && !container) {
      this.viewport.scrollToPosition([0, 0], { behavior: 'instant' });
    }
  }
}
