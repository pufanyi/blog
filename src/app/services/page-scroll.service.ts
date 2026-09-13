import { DOCUMENT, isPlatformBrowser, ViewportScroller } from '@angular/common';
import { afterNextRender, DestroyRef, Injectable, inject, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, Scroll } from '@angular/router';

const SCROLL_STATE_KEY = 'blogScrollPosition';

@Injectable({ providedIn: 'root' })
export class PageScrollService {
  private readonly router = inject(Router);
  private readonly viewport = inject(ViewportScroller);
  private readonly document = inject(DOCUMENT);
  private readonly window = isPlatformBrowser(inject(PLATFORM_ID))
    ? this.document.defaultView
    : null;
  private initialPosition = this.readPosition();
  private lastScroll: Scroll | null = null;
  private userScrolled = false;

  constructor() {
    this.viewport.setHistoryScrollRestoration('manual');
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Only the initial navigation can resume the reloaded document.
        if (event.id !== 1) this.initialPosition = null;
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
    const savePosition = () => this.savePosition();
    const onVisibilityChange = () => {
      if (this.document.visibilityState === 'hidden') savePosition();
    };
    this.window?.addEventListener('pagehide', savePosition);
    this.document.addEventListener('visibilitychange', onVisibilityChange);
    afterNextRender(() => this.restore());
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('wheel', onPointerScroll);
      this.document.removeEventListener('touchmove', onPointerScroll);
      this.document.removeEventListener('keydown', onKey);
      this.window?.removeEventListener('pagehide', savePosition);
      this.document.removeEventListener('visibilitychange', onVisibilityChange);
    });
  }

  // Hydration can suppress the router's initial Scroll event. The URL fragment
  // or saved position still needs restoring after fonts and formulas settle.
  contentSettled(container: HTMLElement): void {
    if (container.isConnected) this.restore(container);
  }

  private readPosition(): [number, number] | null {
    try {
      const navigation = this.window?.performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (navigation?.type !== 'reload') return null;
      const saved = JSON.parse(this.window?.sessionStorage.getItem(SCROLL_STATE_KEY) ?? 'null');
      if (
        saved?.url === this.window?.location.href &&
        Array.isArray(saved?.position) &&
        saved.position.length === 2 &&
        saved.position.every(
          (value: unknown) => typeof value === 'number' && Number.isFinite(value),
        )
      )
        return [saved.position[0], saved.position[1]];
    } catch {
      // Storage can be unavailable or contain an invalid snapshot.
    }
    return null;
  }

  private savePosition(): void {
    if (!this.window) return;
    try {
      // Session storage remains writable during pagehide, after Chromium has
      // already captured the history state used by the replacement document.
      this.window.sessionStorage.setItem(
        SCROLL_STATE_KEY,
        JSON.stringify({
          url: this.window.location.href,
          position: this.viewport.getScrollPosition(),
        }),
      );
    } catch {
      // Reading and navigation must still work when browser storage is blocked.
    }
  }

  private restore(container?: HTMLElement): void {
    const scroll = this.lastScroll;
    if (this.userScrolled || scroll?.scrollBehavior === 'manual') return;
    const position = scroll?.position ?? this.initialPosition;
    if (position) {
      this.viewport.scrollToPosition(position, { behavior: 'instant' });
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
