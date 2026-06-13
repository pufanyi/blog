import {
  ApplicationRef,
  Component,
  ComponentRef,
  EnvironmentInjector,
  OnDestroy,
  ViewEncapsulation,
  computed,
  createComponent,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { POSTS } from '../../data/posts';
import { PostHeaderComponent } from '../../components/post-header/post-header';
import { GiscusCommentsComponent } from '../../components/giscus-comments/giscus-comments';
import { BackToTopComponent } from '../../components/back-to-top/back-to-top';
import { ToolbarExtensionService } from '../../services/toolbar-extension.service';
import { ImageLightboxComponent } from '../../components/image-lightbox/image-lightbox';
import {
  typesetMath,
  initAiSummaryFigures,
  initCodeCopyButtons,
  initContentImageZoom,
  optimizeContentImages,
} from '../../utils/post-content-hooks';
import { smoothScrollTo, SmoothScrollHandle } from '../../utils/smooth-scroll';
import { buildContentWithToc, TocItem } from '../../utils/toc-builder';
import { HeadingObserver } from '../../utils/heading-observer';
import { AutoAnimateDirective } from '../../directives/auto-animate';

const WIDE_QUERY = '(min-width: 1301px)';
const HEADING_SCROLL_OFFSET_PX = 20;

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [
    RouterLink,
    PostHeaderComponent,
    GiscusCommentsComponent,
    BackToTopComponent,
    AutoAnimateDirective,
  ],
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
  private readonly toolbarExt = inject(ToolbarExtensionService);
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly slug = toSignal(this.route.paramMap.pipe(map(p => p.get('slug'))));
  private readonly headingObserver = new HeadingObserver();
  private viewportMediaQuery: MediaQueryList | null = null;
  private scrollHandle: SmoothScrollHandle | null = null;

  private readonly giscus = viewChild(GiscusCommentsComponent);

  readonly tocOpen = signal(false);
  readonly isWide = signal(false);
  readonly activeHeadingId = this.headingObserver.activeHeadingId;

  readonly post = computed(() => {
    const s = this.slug();
    return POSTS.find(p => p.slug === s);
  });

  private readonly processedContent = computed(() => {
    const p = this.post();
    return p ? buildContentWithToc(p.contentHtml) : { html: '', toc: [] as TocItem[] };
  });

  readonly tocItems = computed(() => this.processedContent().toc);

  readonly safeHtml = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.processedContent().html));

  constructor() {
    this.setupViewportObserver();
    this.setupToolbarExtension();

    effect(onCleanup => {
      this.safeHtml();

      if (typeof window === 'undefined') {
        return;
      }

      let cleanupAiSummaryFigures: (() => void) | null = null;
      let cleanupContentImageZoom: (() => void) | null = null;
      let cleanupContentImages: (() => void) | null = null;
      const timer = window.setTimeout(() => {
        const postBody = document.querySelector<HTMLElement>('.post-body');
        void typesetMath(postBody ?? undefined);
        initCodeCopyButtons();
        optimizeContentImages();
        cleanupAiSummaryFigures = initAiSummaryFigures(postBody ?? undefined);
        cleanupContentImages = postBody ? this.hydrateContentImages(postBody) : null;
        cleanupContentImageZoom = initContentImageZoom(postBody ?? undefined);
        this.setupHeadingObserver();
        this.giscus()?.load();
      });

      onCleanup(() => {
        window.clearTimeout(timer);
        cleanupAiSummaryFigures?.();
        cleanupContentImageZoom?.();
        cleanupContentImages?.();
        this.headingObserver.disconnect();
      });
    });
  }

  ngOnDestroy(): void {
    this.headingObserver.disconnect();
    this.teardownViewportObserver();
    this.scrollHandle?.cancel();
    this.toolbarExt.reset();
  }

  toggleToc(): void {
    this.tocOpen.update(value => !value);
  }

  closeToc(): void {
    this.tocOpen.set(false);
  }

  onTocClick(event: Event, id: string): void {
    event.preventDefault();
    this.scrollToHeading(id, true);

    if (!this.isWide() && typeof window !== 'undefined') {
      window.setTimeout(() => this.tocOpen.set(false), 150);
    }
  }

  private setupToolbarExtension(): void {
    this.toolbarExt.mobileTitle.set('Reading');
    this.toolbarExt.leadingButtons.set([
      {
        icon: 'ph-list',
        toggleIcon: 'ph-x',
        ariaLabel: 'Toggle table of contents',
        title: 'Table of Contents',
        action: () => this.toggleToc(),
        isToggled: () => this.tocOpen(),
      },
    ]);
  }

  private setupHeadingObserver(): void {
    const toc = this.tocItems();
    const hashId = this.readHashId();
    this.headingObserver.observe(toc, hashId);

    if (hashId) {
      this.scrollToHeading(hashId, false);
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

    const targetY = Math.max(
      0,
      window.scrollY + heading.getBoundingClientRect().top - HEADING_SCROLL_OFFSET_PX,
    );

    if (smooth) {
      this.scrollHandle?.cancel();
      this.scrollHandle = smoothScrollTo(targetY);
    } else {
      this.scrollHandle?.cancel();
      window.scrollTo(0, targetY);
    }

    this.activeHeadingId.set(id);
    if (typeof history !== 'undefined') {
      history.replaceState(null, '', `#${encodeURIComponent(id)}`);
    }
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

  private hydrateContentImages(container: HTMLElement): () => void {
    const refs: Array<ComponentRef<ImageLightboxComponent>> = [];

    for (const image of Array.from(container.querySelectorAll<HTMLImageElement>('img'))) {
      const src = image.getAttribute('src');
      const width = image.getAttribute('width');
      const height = image.getAttribute('height');

      if (!src || !width || !height) {
        continue;
      }

      const host = document.createElement('app-image-lightbox');
      const ref = createComponent(ImageLightboxComponent, {
        environmentInjector: this.environmentInjector,
        hostElement: host,
      });

      ref.setInput('src', src);
      ref.setInput('alt', image.getAttribute('alt') ?? '');
      ref.setInput('width', width);
      ref.setInput('height', height);
      ref.setInput('imgClass', image.className);
      ref.setInput('loading', image.getAttribute('loading') === 'eager' ? 'eager' : 'lazy');
      ref.setInput('sizes', image.getAttribute('sizes') ?? undefined);

      image.replaceWith(host);
      this.appRef.attachView(ref.hostView);
      ref.changeDetectorRef.detectChanges();
      refs.push(ref);
    }

    return () => {
      for (const ref of refs) {
        this.appRef.detachView(ref.hostView);
        ref.destroy();
      }
    };
  }
}
