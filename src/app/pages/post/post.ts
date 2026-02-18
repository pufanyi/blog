import {
  Component,
  OnDestroy,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { POSTS } from '../../data/posts';
import { PostHeaderComponent } from '../../components/post-header/post-header';
import { FooterComponent } from '../../components/footer/footer';
import { typesetMath, initCodeCopyButtons } from '../../utils/post-content-hooks';

const WIDE_QUERY = '(min-width: 1301px)';
const HASH_UPDATE_DELAY_MS = 320;
const HEADING_SCROLL_OFFSET_PX = 20;

type TocLevel = 2 | 3;

interface TocItem {
  id: string;
  text: string;
  level: TocLevel;
}

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [RouterLink, PostHeaderComponent, FooterComponent],
  templateUrl: './post.html',
  styleUrls: [
    './styles/typography.css',
    './styles/code-blocks.css',
    './styles/tables.css',
    './styles/media.css',
    './styles/layout.css',
  ],
  encapsulation: ViewEncapsulation.None,
})
export class PostComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly slug = toSignal(this.route.paramMap.pipe(map(p => p.get('slug'))));
  private headingObserver: IntersectionObserver | null = null;
  private viewportMediaQuery: MediaQueryList | null = null;
  private hashUpdateTimer: number | null = null;

  readonly tocOpen = signal(false);
  readonly isWide = signal(false);
  readonly activeHeadingId = signal('');

  readonly post = computed(() => {
    const s = this.slug();
    return POSTS.find(p => p.slug === s);
  });

  private readonly processedContent = computed(() => {
    const p = this.post();
    return p ? this.buildContentWithToc(p.contentHtml) : { html: '', toc: [] as TocItem[] };
  });

  readonly tocItems = computed(() => this.processedContent().toc);

  readonly safeHtml = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.processedContent().html));

  constructor() {
    this.setupViewportObserver();

    effect(onCleanup => {
      this.safeHtml();

      if (typeof window === 'undefined') {
        return;
      }

      const timer = window.setTimeout(() => {
        typesetMath();
        initCodeCopyButtons();
        this.setupHeadingObserver();
      });

      onCleanup(() => {
        window.clearTimeout(timer);
        this.disconnectHeadingObserver();
      });
    });
  }

  ngOnDestroy(): void {
    this.disconnectHeadingObserver();
    this.teardownViewportObserver();
    this.clearHashUpdateTimer();
  }

  toggleToc(): void {
    this.tocOpen.update(value => !value);
  }

  closeToc(): void {
    this.tocOpen.set(false);
  }

  onTocClick(event: Event, id: string): void {
    event.preventDefault();

    if (!this.isWide() && typeof window !== 'undefined') {
      this.tocOpen.set(false);
      window.requestAnimationFrame(() => this.scrollToHeading(id, true));
      return;
    }

    this.scrollToHeading(id, true);
  }

  private buildContentWithToc(rawHtml: string): { html: string; toc: TocItem[] } {
    if (typeof DOMParser === 'undefined') {
      return { html: rawHtml, toc: [] };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');
    const usedIds = new Map<string, number>();
    const toc: TocItem[] = [];

    for (const heading of Array.from(doc.querySelectorAll<HTMLHeadingElement>('h2, h3'))) {
      const text = heading.textContent?.trim() ?? '';
      if (!text) {
        continue;
      }

      const level = Number(heading.tagName.slice(1)) as TocLevel;
      const baseId = heading.id.trim() || this.slugify(text);
      const id = this.makeUniqueId(baseId || 'section', usedIds);
      heading.id = id;
      toc.push({ id, text, level });
    }

    return { html: doc.body.innerHTML, toc };
  }

  private setupHeadingObserver(): void {
    this.disconnectHeadingObserver();

    if (typeof document === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const toc = this.tocItems();
    if (!toc.length) {
      return;
    }

    const headings = toc
      .map(item => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => heading !== null);

    if (!headings.length) {
      return;
    }

    const hashId = this.readHashId();
    this.activeHeadingId.set(hashId && headings.some(h => h.id === hashId) ? hashId : headings[0].id);

    this.headingObserver = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          this.activeHeadingId.set((visible[0].target as HTMLElement).id);
          return;
        }

        const nearestAbove = entries
          .filter(entry => entry.boundingClientRect.top < 0)
          .sort((a, b) => b.boundingClientRect.top - a.boundingClientRect.top);

        if (nearestAbove.length > 0) {
          this.activeHeadingId.set((nearestAbove[0].target as HTMLElement).id);
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 1],
      },
    );

    headings.forEach(heading => this.headingObserver?.observe(heading));

    if (hashId) {
      this.scrollToHeading(hashId, false);
    }
  }

  private disconnectHeadingObserver(): void {
    if (this.headingObserver) {
      this.headingObserver.disconnect();
      this.headingObserver = null;
    }
  }

  private setupViewportObserver(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia(WIDE_QUERY);
    this.viewportMediaQuery = mediaQuery;
    this.isWide.set(mediaQuery.matches);
    this.tocOpen.set(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', this.handleViewportChange);
      return;
    }

    mediaQuery.addListener(this.handleViewportChange);
  }

  private teardownViewportObserver(): void {
    const mediaQuery = this.viewportMediaQuery;
    if (!mediaQuery) {
      return;
    }

    if (typeof mediaQuery.removeEventListener === 'function') {
      mediaQuery.removeEventListener('change', this.handleViewportChange);
    } else {
      mediaQuery.removeListener(this.handleViewportChange);
    }

    this.viewportMediaQuery = null;
  }

  private readonly handleViewportChange = (event: MediaQueryListEvent): void => {
    this.isWide.set(event.matches);
    this.tocOpen.set(event.matches);
  };

  private scrollToHeading(id: string, smooth: boolean): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const heading = document.getElementById(id);
    if (!heading) {
      return;
    }

    const top = Math.max(
      0,
      window.scrollY + heading.getBoundingClientRect().top - HEADING_SCROLL_OFFSET_PX,
    );

    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    this.activeHeadingId.set(id);
    this.queueHashUpdate(id, smooth);
  }

  private queueHashUpdate(id: string, smooth: boolean): void {
    if (typeof history === 'undefined' || typeof window === 'undefined') {
      return;
    }

    this.clearHashUpdateTimer();

    if (!smooth) {
      history.replaceState(null, '', `#${encodeURIComponent(id)}`);
      return;
    }

    this.hashUpdateTimer = window.setTimeout(() => {
      history.replaceState(null, '', `#${encodeURIComponent(id)}`);
      this.hashUpdateTimer = null;
    }, HASH_UPDATE_DELAY_MS);
  }

  private readHashId(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const { hash } = window.location;
    if (!hash) {
      return null;
    }

    try {
      return decodeURIComponent(hash.slice(1));
    } catch {
      return null;
    }
  }

  private clearHashUpdateTimer(): void {
    if (this.hashUpdateTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.hashUpdateTimer);
      this.hashUpdateTimer = null;
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private makeUniqueId(base: string, usedIds: Map<string, number>): string {
    const count = usedIds.get(base) ?? 0;
    usedIds.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  }
}
