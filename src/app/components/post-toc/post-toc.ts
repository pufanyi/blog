import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import type { PostTocItem } from '../../models/post.model';

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
  readonly sectionSelected = output<string>();

  private readonly scrollViewport = viewChild<ElementRef<HTMLElement>>('scrollViewport');

  readonly progressPercent = computed(() =>
    Math.round(Math.min(1, Math.max(0, this.progress())) * 100),
  );
  readonly normalizedProgress = computed(() => Math.min(1, Math.max(0, this.progress())));

  constructor() {
    effect(onCleanup => {
      const activeId = this.activeHeadingId();
      const viewport = this.scrollViewport()?.nativeElement;
      if (!activeId || !viewport || typeof window === 'undefined') {
        return;
      }

      const frameId = window.requestAnimationFrame(() => {
        const activeLink = Array.from(
          viewport.querySelectorAll<HTMLElement>('[data-toc-id]'),
        ).find(link => link.dataset['tocId'] === activeId);
        if (!activeLink) {
          return;
        }

        const viewportRect = viewport.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();
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
        viewport.scrollTo({ top: nextTop, behavior: reduceMotion ? 'auto' : 'smooth' });
      });

      onCleanup(() => window.cancelAnimationFrame(frameId));
    });
  }

  hrefFor(id: string): string {
    return `${this.postPath()}#${encodeURIComponent(id)}`;
  }

  containsActiveItem(item: PostTocItem): boolean {
    const activeId = this.activeHeadingId();
    return item.id === activeId || item.children.some(child => child.id === activeId);
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

    this.sectionSelected.emit(id);
  }
}
