import { signal } from '@angular/core';
import type { PostTocItem } from '../models/post.model';

export interface HeadingPosition {
  id: string;
  top: number;
}

export function flattenToc(items: readonly PostTocItem[]): PostTocItem[] {
  return items.flatMap(item => [item, ...flattenToc(item.children)]);
}

export function resolveActiveHeading(
  headings: readonly HeadingPosition[],
  activationLine: number,
  atPageEnd: boolean,
): string {
  if (!headings.length) {
    return '';
  }

  if (atPageEnd) {
    return headings.at(-1)?.id ?? '';
  }

  let activeId = '';
  for (const heading of headings) {
    if (heading.top > activationLine) {
      break;
    }
    activeId = heading.id;
  }

  return activeId;
}

export function calculateReadingProgress(
  articleTop: number,
  articleHeight: number,
  viewportHeight: number,
  activationLine: number,
): number {
  const readableDistance = Math.max(1, articleHeight - viewportHeight + activationLine);
  const consumedDistance = activationLine - articleTop;
  return Math.min(1, Math.max(0, consumedDistance / readableDistance));
}

export class HeadingScrollSpy {
  readonly activeHeadingId = signal('');
  readonly readingProgress = signal(0);

  private article: HTMLElement | null = null;
  private headings: HTMLElement[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private frameId: number | null = null;

  observe(article: HTMLElement, tocItems: readonly PostTocItem[]): void {
    this.disconnect();

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    this.article = article;
    const headingsById = new Map(
      Array.from(article.querySelectorAll<HTMLElement>('h2[id], h3[id]')).map(heading => [
        heading.id,
        heading,
      ]),
    );
    this.headings = flattenToc(tocItems)
      .map(item => headingsById.get(item.id) ?? null)
      .filter((heading): heading is HTMLElement => heading !== null);

    if (!this.headings.length) {
      this.activeHeadingId.set('');
      this.readingProgress.set(0);
      return;
    }

    this.activeHeadingId.set('');

    window.addEventListener('scroll', this.handleViewportChange, { passive: true });
    window.addEventListener('resize', this.handleViewportChange, { passive: true });
    window.addEventListener('hashchange', this.handleLocationChange);
    window.addEventListener('popstate', this.handleLocationChange);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.handleViewportChange);
      this.resizeObserver.observe(article);
    }

    this.scheduleSync();

    void document.fonts?.ready.then(() => this.scheduleSync());
  }

  activate(id: string): void {
    if (this.headings.some(heading => heading.id === id)) {
      this.activeHeadingId.set(id);
    }
  }

  refresh(): void {
    this.scheduleSync();
  }

  disconnect(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleViewportChange);
      window.removeEventListener('resize', this.handleViewportChange);
      window.removeEventListener('hashchange', this.handleLocationChange);
      window.removeEventListener('popstate', this.handleLocationChange);

      if (this.frameId !== null) {
        window.cancelAnimationFrame(this.frameId);
      }
    }

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.frameId = null;
    this.article = null;
    this.headings = [];
  }

  private readonly handleViewportChange = (): void => this.scheduleSync();

  private readonly handleLocationChange = (): void => {
    const hashId = this.readHashId();
    if (hashId) {
      this.activate(hashId);
    }
    this.scheduleSync();
  };

  private scheduleSync(): void {
    if (typeof window === 'undefined' || this.frameId !== null) {
      return;
    }

    this.frameId = window.requestAnimationFrame(() => {
      this.frameId = null;
      this.sync();
    });
  }

  private sync(): void {
    if (
      !this.article ||
      !this.headings.length ||
      typeof window === 'undefined' ||
      typeof document === 'undefined'
    ) {
      return;
    }

    const activationLine = this.getActivationLine();
    const documentHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
    );
    const atPageEnd = Math.ceil(window.scrollY + window.innerHeight) >= documentHeight - 2;
    const activeId = resolveActiveHeading(
      this.headings.map(heading => ({ id: heading.id, top: heading.getBoundingClientRect().top })),
      activationLine,
      atPageEnd,
    );
    const articleRect = this.article.getBoundingClientRect();
    const progress = calculateReadingProgress(
      articleRect.top,
      articleRect.height,
      window.innerHeight,
      activationLine,
    );

    if (this.activeHeadingId() !== activeId) {
      this.activeHeadingId.set(activeId);
    }
    if (this.readingProgress() !== progress) {
      this.readingProgress.set(progress);
    }
  }

  private getActivationLine(): number {
    const firstHeading = this.headings[0];
    if (!firstHeading || typeof getComputedStyle === 'undefined') {
      return 1;
    }

    const scrollMargin = Number.parseFloat(getComputedStyle(firstHeading).scrollMarginTop);
    return (Number.isFinite(scrollMargin) ? scrollMargin : 0) + 1;
  }

  private readHashId(): string | null {
    if (typeof window === 'undefined' || !window.location.hash) {
      return null;
    }

    try {
      return decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return null;
    }
  }
}
