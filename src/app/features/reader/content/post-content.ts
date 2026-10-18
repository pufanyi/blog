import {
  ApplicationRef,
  afterRenderEffect,
  computed,
  Directive,
  ElementRef,
  EnvironmentInjector,
  inject,
  input,
  type OnChanges,
  Renderer2,
  signal,
} from '@angular/core';
import type { Post } from '../../../../contracts/post.model';
import { POST_ENHANCEMENTS } from '../../../data/post-enhancements';
import { PageScrollService } from '../../../platform/page-scroll.service';
import { ArticleRuntime } from './article-runtime';
import { CitationPreviewService } from './citation-preview.service';
import { hydrateContentImages } from './content-images';
import type { HeadingSelection } from './heading-navigation';

/** Angular adapter for author-owned, build-compiled HTML and its reading lifetime. */
@Directive({ selector: '[appPostContent]' })
export class PostContentDirective implements OnChanges {
  readonly post = input.required<Post>({ alias: 'appPostContent' });
  readonly commitHeading = input.required<(id: string) => Promise<boolean>>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly citations = inject(CitationPreviewService);
  private readonly scroll = inject(PageScrollService);
  private readonly runtime = signal<ArticleRuntime | null>(null);
  readonly activeHeadingId = computed(() => this.runtime()?.activeHeadingId() ?? '');
  readonly readingProgress = computed(() => this.runtime()?.readingProgress() ?? 0);

  ngOnChanges(): void {
    // Release mounted views while their old DOM still exists.
    this.runtime()?.dispose();
    const post = this.post();
    const container = this.host.nativeElement;
    if (!post.prerendered || container.dataset['postSlug'] !== post.slug) {
      this.renderer.setProperty(container, 'innerHTML', post.contentHtml);
    }
    this.renderer.setAttribute(container, 'data-post-slug', post.slug);
  }

  constructor() {
    afterRenderEffect((onCleanup) => {
      const post = this.post();
      const commitFragment = this.commitHeading();
      const container = this.host.nativeElement;
      const runtime = new ArticleRuntime(container, post, {
        commitFragment,
        mountImages: () => hydrateContentImages(container, this.environmentInjector, this.appRef),
        bindCitations: () => this.citations.bind(container),
        enhancements: POST_ENHANCEMENTS.get(post.slug) ?? [],
        contentSettled: () => this.scroll.contentSettled(container),
      });
      this.runtime.set(runtime);
      onCleanup(() => {
        runtime.dispose();
        this.runtime.set(null);
      });
    });
  }

  activateHeading(selection: HeadingSelection): void {
    this.runtime()?.activateHeading(selection);
  }
}
