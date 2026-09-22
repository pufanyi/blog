import {
  ApplicationRef,
  afterRenderEffect,
  Directive,
  ElementRef,
  EnvironmentInjector,
  inject,
  input,
  type OnChanges,
  Renderer2,
} from '@angular/core';
import { Router } from '@angular/router';
import { POST_ENHANCEMENTS } from '../data/post-enhancements';
import type { Post } from '../models/post.model';
import { CitationPreviewService } from '../services/citation-preview.service';
import { PageScrollService } from '../services/page-scroll.service';
import { prepareArticlePrint } from '../utils/article-print';
import { hydrateContentImages } from '../utils/content-images';
import { HeadingNavigation, type HeadingSelection } from '../utils/heading-navigation';
import { HeadingScrollSpy } from '../utils/heading-scroll-spy';
import { clearMath } from '../utils/mathjax';
import {
  initCodeCopyButtons,
  initContentImageZoom,
  optimizeContentImages,
} from '../utils/post-content-hooks';
import { bindPostEnhancements } from '../utils/post-enhancements';
import { bindStaticMathCopy } from '../utils/static-math';

@Directive({
  selector: '[appPostContent]',
})
export class PostContentDirective implements OnChanges {
  readonly post = input.required<Post>({ alias: 'appPostContent' });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly citations = inject(CitationPreviewService);
  private readonly scroll = inject(PageScrollService);
  private readonly router = inject(Router);
  private readonly spy = new HeadingScrollSpy();
  private headingNavigation: HeadingNavigation | null = null;
  private disposeCurrentRender: (() => void) | undefined;
  readonly activeHeadingId = this.spy.activeHeadingId;
  readonly readingProgress = this.spy.readingProgress;

  ngOnChanges(): void {
    // Clear math registrations and mounted views while the old DOM still exists.
    this.disposeCurrentRender?.();
    const post = this.post();
    const container = this.host.nativeElement;
    // Only author-owned, build-compiled HTML reaches this boundary. Do not rewrite
    // the initial document: it already contains the exact article and formulas.
    if (!post.prerendered || container.dataset['postSlug'] !== post.slug) {
      this.renderer.setProperty(container, 'innerHTML', post.contentHtml);
    }
    this.renderer.setAttribute(container, 'data-post-slug', post.slug);
  }

  constructor() {
    afterRenderEffect((onCleanup) => {
      const post = this.post();
      const container = this.host.nativeElement;
      const abort = new AbortController();
      let settleFrame: number | undefined;
      container.dataset['rendered'] = 'true';
      optimizeContentImages(container);
      const cleanups = [
        prepareArticlePrint(container),
        bindStaticMathCopy(container),
        initCodeCopyButtons(container),
        hydrateContentImages(container, this.environmentInjector, this.appRef),
        initContentImageZoom(container),
        this.citations.bind(container),
        bindPostEnhancements(container, POST_ENHANCEMENTS.get(post.slug) ?? []),
      ];
      this.spy.observe(container, post.toc);
      const navigation = new HeadingNavigation(container, this.spy, async (id) => {
        const url = this.router.parseUrl(this.router.url);
        url.fragment = id;
        const navigated = await this.router.navigateByUrl(url, { scroll: 'manual' });
        return navigated || this.router.url === this.router.serializeUrl(url);
      });
      this.headingNavigation = navigation;
      void Promise.resolve(container.ownerDocument.fonts?.ready).then(() => {
        if (abort.signal.aborted) return;
        // Let the browser finish its pending native fragment-scroll frame
        // before correcting the position using the settled article layout.
        settleFrame = requestAnimationFrame(() => {
          this.spy.refresh();
          container.dataset['mathReady'] = 'true';
          this.scroll.contentSettled(container);
        });
      });
      let disposed = false;
      const dispose = () => {
        if (disposed) return;
        disposed = true;
        abort.abort();
        if (settleFrame !== undefined) cancelAnimationFrame(settleFrame);
        navigation.cancel();
        if (this.headingNavigation === navigation) this.headingNavigation = null;
        this.spy.disconnect();
        clearMath(container);
        delete container.dataset['rendered'];
        delete container.dataset['mathReady'];
        for (const cleanup of cleanups.reverse()) cleanup();
        if (this.disposeCurrentRender === dispose) this.disposeCurrentRender = undefined;
      };
      this.disposeCurrentRender = dispose;
      onCleanup(dispose);
    });
  }

  activateHeading(selection: HeadingSelection): void {
    this.headingNavigation?.select(selection);
  }
}
