import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { PostTocItem } from '../../models/post.model';
import { ToolbarExtensionService } from '../../services/toolbar-extension.service';
import { PostTocComponent } from '../post-toc/post-toc';

const WIDE_QUERY = '(min-width: 1480px)';

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
  readonly sectionSelected = output<string>();
  readonly tocOpen = signal(false);
  private readonly toolbarExt = inject(ToolbarExtensionService);
  private readonly tocDialog = viewChild<ElementRef<HTMLDialogElement>>('tocDialog');
  private viewportMediaQuery: MediaQueryList | null = null;
  private tocTrigger: HTMLElement | null = null;
  private restoreTocTrigger = true;

  constructor() {
    this.setupViewportObserver();
    this.setupToolbarExtension();
    effect(() => {
      this.postPath();
      untracked(() => this.closeToc(false));
    });
  }

  ngOnDestroy(): void {
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
    this.closeToc(false);
    this.sectionSelected.emit(id);
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
      this.toolbarExt.mobileTitle.set('Reading');
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
      this.closeToc(false);
    }
  };
}
