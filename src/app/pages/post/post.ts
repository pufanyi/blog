import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  ElementRef,
  EnvironmentInjector,
  OnDestroy,
  ViewEncapsulation,
  computed,
  createComponent,
  effect,
  inject,
  signal,
  untracked,
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
import { PostTocComponent } from '../../components/post-toc/post-toc';
import { ToolbarExtensionService } from '../../services/toolbar-extension.service';
import { CitationPreviewService } from '../../services/citation-preview.service';
import { ImageLightboxComponent } from '../../components/image-lightbox/image-lightbox';
import {
  typesetMath,
  initCodeCopyButtons,
  initContentImageZoom,
  optimizeContentImages,
} from '../../utils/post-content-hooks';
import { HeadingScrollSpy } from '../../utils/heading-scroll-spy';

const WIDE_QUERY = '(min-width: 1480px)';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [
    RouterLink,
    PostHeaderComponent,
    GiscusCommentsComponent,
    BackToTopComponent,
    PostTocComponent,
  ],
  templateUrl: './post.html',
  styleUrls: [
    './styles/typography.css',
    './styles/code-blocks.css',
    './styles/tables.css',
    './styles/media.css',
    './styles/layout.css',
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class PostComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly toolbarExt = inject(ToolbarExtensionService);
  private readonly citationPreview = inject(CitationPreviewService);
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly slug = toSignal(this.route.paramMap.pipe(map(p => p.get('slug'))));
  private readonly headingScrollSpy = new HeadingScrollSpy();
  private viewportMediaQuery: MediaQueryList | null = null;
  private tocTrigger: HTMLElement | null = null;
  private restoreTocTrigger = true;

  private readonly giscus = viewChild(GiscusCommentsComponent);
  private readonly postBody = viewChild<ElementRef<HTMLElement>>('postBody');
  private readonly tocDialog = viewChild<ElementRef<HTMLDialogElement>>('tocDialog');

  readonly tocOpen = signal(false);
  readonly activeHeadingId = this.headingScrollSpy.activeHeadingId;
  readonly readingProgress = this.headingScrollSpy.readingProgress;

  readonly post = computed(() => {
    const s = this.slug();
    return POSTS.find(p => p.slug === s);
  });

  readonly tocItems = computed(() => this.post()?.toc ?? []);
  readonly postPath = computed(() => {
    const post = this.post();
    return post ? `/blog/${encodeURIComponent(post.slug)}` : '/blog';
  });

  readonly safeHtml = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.post()?.contentHtml ?? ''),
  );

  constructor() {
    this.setupViewportObserver();
    this.setupToolbarExtension();

    effect(() => {
      this.slug();
      untracked(() => this.closeToc(false));
    });

    effect(onCleanup => {
      this.safeHtml();

      if (typeof window === 'undefined') {
        return;
      }

      let cleanupContentImageZoom: (() => void) | null = null;
      let cleanupContentImages: (() => void) | null = null;
      let cleanupCitationPreviews: (() => void) | null = null;
      let setupTimer: number | null = null;
      let isDisposed = false;

      const runPostHooks = (attempt = 0) => {
        setupTimer = window.setTimeout(() => {
          setupTimer = null;
          if (isDisposed) {
            return;
          }

          const postBody = this.postBody()?.nativeElement;
          if (!postBody || postBody.childElementCount === 0) {
            if (attempt < 20) {
              runPostHooks(attempt + 1);
            }
            return;
          }

          void typesetMath(postBody).finally(() => this.headingScrollSpy.refresh());
          initCodeCopyButtons();
          optimizeContentImages();
          cleanupContentImages = this.hydrateContentImages(postBody);
          cleanupContentImageZoom = initContentImageZoom(postBody);
          cleanupCitationPreviews = this.citationPreview.bind(postBody);
          this.setupHeadingScrollSpy(postBody);
          this.giscus()?.load();
        }, attempt === 0 ? 0 : 25);
      };

      runPostHooks();

      onCleanup(() => {
        isDisposed = true;
        if (setupTimer !== null) {
          window.clearTimeout(setupTimer);
        }
        cleanupContentImageZoom?.();
        cleanupContentImages?.();
        cleanupCitationPreviews?.();
        this.headingScrollSpy.disconnect();
      });
    });
  }

  ngOnDestroy(): void {
    this.headingScrollSpy.disconnect();
    this.teardownViewportObserver();
    this.closeToc(false);
    this.toolbarExt.reset();
  }

  toggleToc(): void {
    const dialog = this.tocDialog()?.nativeElement;
    if (!dialog || this.viewportMediaQuery?.matches) {
      return;
    }

    if (dialog.open) {
      this.closeToc();
      return;
    }

    this.tocTrigger =
      typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    this.restoreTocTrigger = true;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    this.tocOpen.set(true);
  }

  closeToc(restoreTrigger = true): void {
    this.restoreTocTrigger = restoreTrigger;
    const dialog = this.tocDialog()?.nativeElement;
    if (dialog?.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
        this.onTocDialogClose();
      }
      return;
    }

    this.tocOpen.set(false);
    if (!restoreTrigger) {
      this.tocTrigger = null;
      this.restoreTocTrigger = true;
    }
  }

  onTocNavigate(id: string): void {
    this.headingScrollSpy.activate(id);
    this.closeToc(false);

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        const heading = Array.from(
          this.postBody()?.nativeElement.querySelectorAll<HTMLElement>('h2[id], h3[id]') ?? [],
        ).find(candidate => candidate.id === id);
        heading?.focus({ preventScroll: true });
      });
    }
  }

  onTocDialogClose(): void {
    this.tocOpen.set(false);
    const trigger = this.restoreTocTrigger ? this.tocTrigger : null;
    this.tocTrigger = null;
    this.restoreTocTrigger = true;

    if (trigger?.isConnected) {
      queueMicrotask(() => trigger.focus({ preventScroll: true }));
    }
  }

  onTocDialogClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeToc();
    }
  }

  private setupToolbarExtension(): void {
    this.toolbarExt.mobileTitle.set('Reading');
    effect(() => {
      this.toolbarExt.leadingButtons.set(
        this.tocItems().length
          ? [
              {
                icon: 'ph-list',
                toggleIcon: 'ph-x',
                ariaLabel: 'Toggle table of contents',
                title: 'Table of Contents',
                action: () => this.toggleToc(),
                isToggled: () => this.tocOpen(),
                ariaControls: 'post-toc-dialog',
                isExpanded: () => this.tocOpen(),
              },
            ]
          : [],
      );
    });
  }

  private setupHeadingScrollSpy(postBody: HTMLElement): void {
    this.headingScrollSpy.observe(postBody, this.tocItems(), this.readHashId());
  }

  private setupViewportObserver(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia(WIDE_QUERY);
    this.viewportMediaQuery = mediaQuery;

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
    if (event.matches) {
      this.closeToc(false);
    }
  };

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
    const refs: ComponentRef<ImageLightboxComponent>[] = [];

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
