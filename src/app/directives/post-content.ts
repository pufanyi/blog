import {
  ApplicationRef,
  Directive,
  ElementRef,
  EnvironmentInjector,
  afterRenderEffect,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import type { Post } from '../models/post.model';
import { CitationPreviewService } from '../services/citation-preview.service';
import { PageScrollService } from '../services/page-scroll.service';
import { hydrateContentImages } from '../utils/content-images';
import { HeadingScrollSpy } from '../utils/heading-scroll-spy';
import { clearMath, typesetMath } from '../utils/mathjax';
import {
  initCodeCopyButtons,
  initContentImageZoom,
  optimizeContentImages,
} from '../utils/post-content-hooks';

@Directive({
  selector: '[appPostContent]',
  host: { '[innerHTML]': 'html()' },
})
export class PostContentDirective {
  readonly post = input.required<Post>({ alias: 'appPostContent' });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly citations = inject(CitationPreviewService);
  private readonly scroll = inject(PageScrollService);
  private readonly spy = new HeadingScrollSpy();
  readonly activeHeadingId = this.spy.activeHeadingId;
  readonly readingProgress = this.spy.readingProgress;
  // HTML is compiled from author-owned MDX at build time.
  protected readonly html = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.post().contentHtml),
  );

  constructor() {
    afterRenderEffect(onCleanup => {
      const post = this.post();
      const container = this.host.nativeElement;
      const abort = new AbortController();
      let settleFrame: number | undefined;
      optimizeContentImages(container);
      const cleanups = [
        initCodeCopyButtons(container),
        hydrateContentImages(container, this.environmentInjector, this.appRef),
        initContentImageZoom(container),
        this.citations.bind(container),
      ];
      this.spy.observe(container, post.toc);
      void Promise.all([
        typesetMath(container, abort.signal),
        container.ownerDocument.fonts?.ready,
      ]).then(() => {
        if (abort.signal.aborted) return;
        // Let the browser finish its pending native fragment-scroll frame
        // before correcting the position using the settled article layout.
        settleFrame = requestAnimationFrame(() => {
          this.spy.refresh();
          this.scroll.contentSettled(container);
        });
      });
      onCleanup(() => {
        abort.abort();
        if (settleFrame !== undefined) cancelAnimationFrame(settleFrame);
        this.spy.disconnect();
        clearMath(container);
        for (const cleanup of cleanups.reverse()) cleanup();
      });
    });
  }

  activateHeading(id: string): void {
    this.spy.activate(id);
    requestAnimationFrame(() => {
      const heading = Array.from(
        this.host.nativeElement.querySelectorAll<HTMLElement>('h2[id], h3[id]'),
      ).find(candidate => candidate.id === id);
      heading?.focus({ preventScroll: true });
    });
  }
}
