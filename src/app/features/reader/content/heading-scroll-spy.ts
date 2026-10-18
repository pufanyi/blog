import { signal } from '@angular/core';
import type { PostTocItem } from '../../../../contracts/post.model';

export interface HeadingPosition {
  id: string;
  top: number;
}

export function flattenToc(items: readonly PostTocItem[]): PostTocItem[] {
  return items.flatMap((item) => [item, ...flattenToc(item.children)]);
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

  let low = 0;
  let high = headings.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (headings[middle]!.top <= activationLine) low = middle + 1;
    else high = middle;
  }
  return headings[low - 1]?.id ?? '';
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
  private dirty = true;
  private positions: HeadingPosition[] = [];
  private articleTop = 0;
  private articleHeight = 0;
  private documentHeight = 0;
  private activationLine = 0;
  private heldHeadingId = '';
  private settledScrollY: number | null = null;

  observe(article: HTMLElement, tocItems: readonly PostTocItem[]): void {
    this.disconnect();

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    this.article = article;
    const headingsById = new Map(
      Array.from(article.querySelectorAll<HTMLElement>('h2[id], h3[id]')).map((heading) => [
        heading.id,
        heading,
      ]),
    );
    this.headings = flattenToc(tocItems)
      .map((item) => headingsById.get(item.id) ?? null)
      .filter((heading): heading is HTMLElement => heading !== null);

    if (!this.headings.length) {
      this.activeHeadingId.set('');
      this.readingProgress.set(0);
      return;
    }

    this.activeHeadingId.set('');

    window.addEventListener('scroll', this.handleViewportChange, { passive: true });
    window.addEventListener('resize', this.handleGeometryChange, { passive: true });
    article.addEventListener('toggle', this.handleGeometryChange, true);
    article.addEventListener('load', this.handleGeometryChange, true);
    document.fonts?.addEventListener('loadingdone', this.handleGeometryChange);
    window.addEventListener('hashchange', this.handleLocationChange);
    window.addEventListener('popstate', this.handleLocationChange);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.handleGeometryChange);
      this.resizeObserver.observe(article);
      this.resizeObserver.observe(document.body);
    }

    this.refresh();

    void document.fonts?.ready.then(() => {
      if (this.article === article) this.refresh();
    });
  }

  activate(id: string): void {
    if (this.headings.some((heading) => heading.id === id)) {
      this.activeHeadingId.set(id);
    }
  }

  hold(id: string): void {
    this.heldHeadingId = id;
    this.settledScrollY = null;
    this.activate(id);
  }

  settle(): void {
    // A target near the document end cannot always reach the activation line.
    // Keep the deliberate selection until the reader actually moves again.
    this.settledScrollY = window.scrollY;
  }

  release(): void {
    this.heldHeadingId = '';
    this.settledScrollY = null;
    this.scheduleSync();
  }

  refresh(): void {
    this.dirty = true;
    this.scheduleSync();
  }

  disconnect(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleViewportChange);
      window.removeEventListener('resize', this.handleGeometryChange);
      window.removeEventListener('hashchange', this.handleLocationChange);
      window.removeEventListener('popstate', this.handleLocationChange);

      if (this.frameId !== null) {
        window.cancelAnimationFrame(this.frameId);
      }
    }

    this.article?.removeEventListener('toggle', this.handleGeometryChange, true);
    this.article?.removeEventListener('load', this.handleGeometryChange, true);
    if (typeof document !== 'undefined')
      document.fonts?.removeEventListener('loadingdone', this.handleGeometryChange);

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.frameId = null;
    this.article = null;
    this.headings = [];
    this.positions = [];
    this.heldHeadingId = '';
    this.settledScrollY = null;
    this.dirty = true;
  }

  private readonly handleViewportChange = (): void => {
    if (this.settledScrollY !== null && Math.abs(window.scrollY - this.settledScrollY) > 1) {
      this.release();
    }
    this.scheduleSync();
  };
  private readonly handleGeometryChange = (): void => {
    if (this.settledScrollY !== null) this.release();
    this.refresh();
  };

  private readonly handleLocationChange = (): void => {
    this.release();
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

    if (this.dirty) {
      this.dirty = false;
      const scrollY = window.scrollY;
      this.activationLine = this.getActivationLine();
      this.documentHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );
      this.positions = this.headings
        .filter((heading) => heading.getClientRects().length > 0)
        .map((heading) => ({ id: heading.id, top: heading.getBoundingClientRect().top + scrollY }));
      const rect = this.article.getBoundingClientRect();
      this.articleTop = rect.top + scrollY;
      this.articleHeight = rect.height;
    }
    const scrollY = window.scrollY;
    const atPageEnd = Math.ceil(scrollY + window.innerHeight) >= this.documentHeight - 2;
    const activeId =
      this.heldHeadingId ||
      resolveActiveHeading(this.positions, scrollY + this.activationLine, atPageEnd);
    const progress = calculateReadingProgress(
      this.articleTop - scrollY,
      this.articleHeight,
      window.innerHeight,
      this.activationLine,
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
