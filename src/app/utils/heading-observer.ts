import { signal } from '@angular/core';
import { TocItem } from './toc-builder';

const HEADING_SCROLL_OFFSET_PX = 20;

export class HeadingObserver {
  readonly activeHeadingId = signal('');
  private observer: IntersectionObserver | null = null;
  private trackedHeadings: HTMLElement[] = [];

  observe(tocItems: TocItem[], hashId: string | null): void {
    this.disconnect();

    if (typeof document === 'undefined' || typeof IntersectionObserver === 'undefined') {
      this.trackedHeadings = [];
      return;
    }

    if (!tocItems.length) {
      this.trackedHeadings = [];
      return;
    }

    const headings = tocItems
      .map(item => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => heading !== null);

    if (!headings.length) {
      this.trackedHeadings = [];
      return;
    }

    this.trackedHeadings = headings;
    this.activeHeadingId.set(
      hashId && headings.some(h => h.id === hashId) ? hashId : headings[0].id,
    );

    this.observer = new IntersectionObserver(
      () => {
        this.syncActiveHeading();
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 1],
      },
    );

    headings.forEach(heading => this.observer?.observe(heading));

    if (!hashId) {
      this.syncActiveHeading();
    }
  }

  disconnect(): void {
    this.trackedHeadings = [];
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  syncActiveHeading(): void {
    if (!this.trackedHeadings.length) {
      return;
    }

    const anchorTop = HEADING_SCROLL_OFFSET_PX + 1;
    let activeId = this.trackedHeadings[0].id;

    for (const heading of this.trackedHeadings) {
      if (heading.getBoundingClientRect().top <= anchorTop) {
        activeId = heading.id;
      } else {
        break;
      }
    }

    this.activeHeadingId.set(activeId);
  }
}
