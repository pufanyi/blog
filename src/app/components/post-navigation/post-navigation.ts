import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { PostTocItem } from '../../models/post.model';
import { ToolbarExtensionService } from '../../services/toolbar-extension.service';
import type { HeadingSelection } from '../../utils/heading-navigation';
import { PostTocComponent } from '../post-toc/post-toc';

const WIDE_QUERY = '(min-width: 1024px)';

@Component({
  selector: 'app-post-navigation',
  imports: [PostTocComponent],
  templateUrl: './post-navigation.html',
  styleUrl: './post-navigation.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PostNavigationComponent implements OnDestroy {
  readonly items = input.required<PostTocItem[]>();
  readonly postPath = input.required<string>();
  readonly activeHeadingId = input('');
  readonly readingProgress = input(0);
  readonly sectionSelected = output<HeadingSelection>();
  readonly tocOpen = signal(false);
  readonly tocClosing = signal(false);
  readonly outlinePinned = signal(false);
  readonly currentSection = computed(
    () =>
      this.items()
        .flatMap((item) => [item, ...item.children])
        .find((item) => item.id === this.activeHeadingId())?.text ?? '',
  );
  private readonly toolbarExt = inject(ToolbarExtensionService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly tocDialog = viewChild<ElementRef<HTMLDialogElement>>('tocDialog');
  private readonly outlineAnchor = viewChild<ElementRef<HTMLElement>>('outlineAnchor');
  private readonly sidebar = viewChild<ElementRef<HTMLElement>>('sidebar');
  private viewportMediaQuery: MediaQueryList | null = null;
  private tocTrigger: HTMLElement | null = null;
  private restoreTocTrigger = true;
  private finishClosing: (() => void) | null = null;
  private closing: Promise<void> | null = null;

  constructor() {
    this.setupViewportObserver();
    this.setupToolbarExtension();
    afterRenderEffect((onCleanup) => {
      const host = this.host.nativeElement;
      const layout = host.parentElement;
      const anchor = this.outlineAnchor()?.nativeElement;
      const sidebar = this.sidebar()?.nativeElement;
      if (!layout || !anchor || !sidebar) return;
      let pinObserver: IntersectionObserver | null = null;
      // Read the grid row's document position, not the sticky child's position.
      // Reserve that opening space throughout reading; no scroll-time DOM reads.
      const update = () => {
        const start = Math.max(0, host.getBoundingClientRect().top + window.scrollY);
        host.style.setProperty('--post-outline-start', `${start}px`);
        pinObserver?.disconnect();
        if (!this.viewportMediaQuery?.matches || typeof IntersectionObserver === 'undefined') {
          this.outlinePinned.set(false);
          return;
        }
        // Once the title row passes the toolbar, detach from the grid's bottom
        // boundary so the outline remains reachable even at the article footer.
        const clearance = parseFloat(getComputedStyle(sidebar).top);
        pinObserver = new IntersectionObserver(
          ([entry]) => {
            if (entry) {
              this.outlinePinned.set(
                !entry.isIntersecting && entry.boundingClientRect.top < clearance,
              );
            }
          },
          { rootMargin: `-${clearance}px 0px 0px 0px` },
        );
        pinObserver.observe(anchor);
      };
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
      observer?.observe(layout);
      window.addEventListener('resize', update, { passive: true });
      update();
      onCleanup(() => {
        observer?.disconnect();
        pinObserver?.disconnect();
        window.removeEventListener('resize', update);
      });
    });
    effect(() => {
      this.postPath();
      untracked(() => this.closeToc(false, false));
    });
  }

  ngOnDestroy(): void {
    this.teardownViewportObserver();
    void this.closeToc(false, false);
    this.toolbarExt.reset();
  }

  toggleToc(): void {
    const dialog = this.tocDialog()?.nativeElement;
    if (!dialog || this.viewportMediaQuery?.matches || this.tocClosing()) {
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

  closeToc(restoreTrigger = true, animate = true): Promise<void> {
    if (this.finishClosing) {
      this.restoreTocTrigger &&= restoreTrigger;
      const closing = this.closing!;
      if (!animate) this.finishClosing();
      return closing;
    }
    this.restoreTocTrigger = restoreTrigger;
    const dialog = this.tocDialog()?.nativeElement;
    if (dialog?.open) {
      const close = () => {
        if (typeof dialog.close === 'function') {
          dialog.close();
        } else {
          dialog.removeAttribute('open');
          this.onTocDialogClose();
        }
      };
      if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        close();
        return Promise.resolve();
      }
      // Keep the native modal/inert state until the exit finishes. WebKit does
      // not reliably retain dialog display/top-layer state for a CSS-only exit.
      this.tocClosing.set(true);
      this.closing = new Promise<void>((resolve) => {
        const finish = () => {
          window.clearTimeout(timer);
          dialog.removeEventListener('transitionend', onEnd);
          this.finishClosing = null;
          this.closing = null;
          this.tocClosing.set(false);
          close();
          resolve();
        };
        const onEnd = (event: TransitionEvent) => {
          if (event.target === dialog && event.propertyName === 'transform') finish();
        };
        // Also settle if styles are overridden or the tab stops painting.
        const timer = window.setTimeout(finish, 240);
        this.finishClosing = finish;
        dialog.addEventListener('transitionend', onEnd);
      });
      return this.closing;
    }

    this.tocOpen.set(false);
    if (!restoreTrigger) {
      this.tocTrigger = null;
      this.restoreTocTrigger = true;
    }
    return Promise.resolve();
  }

  onTocNavigate(selection: HeadingSelection): void {
    const ready = this.closeToc(false);
    this.sectionSelected.emit({ ...selection, ready });
  }

  onTocDialogCancel(event: Event): void {
    event.preventDefault();
    void this.closeToc();
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
    effect(() => {
      this.toolbarExt.pageTitle.set(this.currentSection() || 'Reading');
      this.toolbarExt.leadingButtons.set(
        this.items().length
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
      void this.closeToc(false, false);
    }
  };
}
