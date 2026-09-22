import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { PostTocItem } from '../../models/post.model';
import type { HeadingSelection } from '../../utils/heading-navigation';

@Component({
  selector: 'app-post-toc',
  standalone: true,
  templateUrl: './post-toc.html',
  styleUrl: './post-toc.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PostTocComponent {
  readonly items = input.required<readonly PostTocItem[]>();
  readonly postPath = input.required<string>();
  readonly activeHeadingId = input('');
  readonly progress = input(0);
  readonly idPrefix = input('toc');
  readonly collapsible = input(false);
  readonly visible = input(true);
  readonly collapsed = signal(false);
  readonly sectionSelected = output<HeadingSelection>();
  readonly interactive = signal(false);

  private readonly scrollViewport = viewChild<ElementRef<HTMLElement>>('scrollViewport');
  private readonly manualExpansion = signal<ReadonlyMap<string, boolean>>(new Map());
  private readonly focusedChapterId = signal('');

  readonly progressPercent = computed(() =>
    Math.round(Math.min(1, Math.max(0, this.progress())) * 100),
  );
  readonly normalizedProgress = computed(() => Math.min(1, Math.max(0, this.progress())));
  readonly currentSection = computed(
    () =>
      this.items()
        .flatMap((item) => [item, ...item.children])
        .find((item) => item.id === this.activeHeadingId())?.text ?? 'Choose a chapter',
  );

  constructor() {
    // Prerendered/no-JavaScript readers retain every section link.
    afterNextRender(() => this.interactive.set(true));
    effect(() => {
      this.postPath();
      this.manualExpansion.set(new Map());
      this.focusedChapterId.set('');
      this.collapsed.set(false);
    });
    effect((onCleanup) => {
      const activeId = this.activeHeadingId();
      const viewport = this.scrollViewport()?.nativeElement;
      if (
        !this.visible() ||
        this.collapsed() ||
        !activeId ||
        !viewport ||
        typeof window === 'undefined'
      ) {
        return;
      }

      const frameId = window.requestAnimationFrame(() => {
        this.revealActiveLink();
      });

      onCleanup(() => window.cancelAnimationFrame(frameId));
    });
  }

  onDisclosureTransitionEnd(event: TransitionEvent): void {
    if (event.propertyName === 'grid-template-rows') this.revealActiveLink();
  }

  private revealActiveLink(): void {
    const viewport = this.scrollViewport()?.nativeElement;
    if (
      !this.visible() ||
      this.collapsed() ||
      !viewport ||
      viewport.contains(document.activeElement) ||
      viewport.matches(':hover')
    )
      return;
    const activeLink = Array.from(viewport.querySelectorAll<HTMLElement>('[data-toc-id]')).find(
      (link) => link.dataset['tocId'] === this.activeHeadingId(),
    );
    if (!activeLink) return;
    const viewportRect = viewport.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    if (!viewportRect.height || !linkRect.height) return;
    const inset = 12;
    let nextTop = viewport.scrollTop;
    if (linkRect.top < viewportRect.top + inset) {
      nextTop += linkRect.top - viewportRect.top - inset;
    } else if (linkRect.bottom > viewportRect.bottom - inset) {
      nextTop += linkRect.bottom - viewportRect.bottom + inset;
    } else {
      return;
    }
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    viewport.scrollTo({ top: nextTop, behavior: reduceMotion ? 'instant' : 'smooth' });
  }

  hrefFor(id: string): string {
    return `${this.postPath()}#${encodeURIComponent(id)}`;
  }

  chapterNumber(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  isExpanded(item: PostTocItem): boolean {
    if (!this.interactive()) return true;
    return (
      this.manualExpansion().get(item.id) ??
      (this.containsActiveItem(item) || this.focusedChapterId() === item.id)
    );
  }

  isCurrentChapter(item: PostTocItem): boolean {
    return (
      this.activeHeadingId() === item.id ||
      (this.containsActiveItem(item) && !this.isExpanded(item))
    );
  }

  toggleChapter(item: PostTocItem): void {
    const expanded = !this.isExpanded(item);
    this.manualExpansion.update((current) => new Map(current).set(item.id, expanded));
  }

  onFocusChange(event: FocusEvent): void {
    const target = event.type === 'focusout' ? event.relatedTarget : event.target;
    const item =
      target instanceof Element && target.closest('.toc-sublist')
        ? target.closest<HTMLElement>('[data-toc-chapter]')
        : null;
    this.focusedChapterId.set(item?.dataset['tocChapter'] ?? '');
  }

  containsActiveItem(item: PostTocItem): boolean {
    const activeId = this.activeHeadingId();
    return item.id === activeId || item.children.some((child) => child.id === activeId);
  }

  selectSection(event: MouseEvent, id: string): void {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    this.sectionSelected.emit({ id, event });
  }
}
