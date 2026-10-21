import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { parentBlogSlug } from '../../../contracts/blog-directories';
import type { Post } from '../../../contracts/post.model';
import { BLOG_CONFIG } from '../../data/blog-config';
import { COMMENTS_CONFIG } from '../../data/comments-config';
import { PageChromeService } from '../../platform/page-chrome.service';
import { BlogBreadcrumbsComponent } from '../../shared/ui/blog-breadcrumbs/blog-breadcrumbs';
import { NotFoundComponent } from '../../shared/ui/not-found/not-found';
import { PostContentDirective } from './content/post-content';
import { GiscusCommentsComponent } from './giscus-comments/giscus-comments';
import { BackToTopComponent } from './navigation/back-to-top/back-to-top';
import { PostNavigationComponent } from './navigation/post-navigation';
import { PostCitationComponent } from './post-citation/post-citation';
import { PostHeaderComponent } from './post-header/post-header';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [
    PostHeaderComponent,
    GiscusCommentsComponent,
    BackToTopComponent,
    PostNavigationComponent,
    PostCitationComponent,
    PostContentDirective,
    NotFoundComponent,
    BlogBreadcrumbsComponent,
  ],
  templateUrl: './reader-page.html',
  styleUrls: [
    '../../shared/rich-content/typography.css',
    '../../shared/rich-content/code-blocks.css',
    '../../shared/rich-content/tables.css',
    './styles/media.css',
    './styles/layout.css',
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class ReaderPageComponent {
  readonly showCitation = BLOG_CONFIG.showCitation;
  readonly commentsEnabled = COMMENTS_CONFIG.enabled;
  private readonly router = inject(Router);
  readonly commitHeading = async (id: string): Promise<boolean> => {
    const url = this.router.parseUrl(this.router.url);
    url.fragment = id;
    const navigated = await this.router.navigateByUrl(url, { scroll: 'manual' });
    return navigated || this.router.url === this.router.serializeUrl(url);
  };
  private readonly route = inject(ActivatedRoute);
  readonly post = toSignal(this.route.data.pipe(map((data) => data['post'] as Post | null)), {
    initialValue: null,
  });
  readonly navigation = viewChild(PostNavigationComponent);
  readonly content = viewChild(PostContentDirective);
  readonly postPath = computed(() => `/blog/${this.post()?.slug ?? ''}`);
  readonly parentSlug = computed(() => parentBlogSlug(this.post()?.slug ?? ''));
  constructor() {
    const chrome = inject(PageChromeService).register();
    inject(DestroyRef).onDestroy(() => chrome.dispose());
    effect(() => {
      const navigation = this.navigation();
      const hasOutline = !!this.post()?.toc.length;
      chrome.update({
        title: this.post() ? navigation?.currentSection() || 'Reading' : '',
        // Below the sidebar breakpoint the bottom dock is the only contents control.
        readingDock: hasOutline,
      });
    });
  }
}
