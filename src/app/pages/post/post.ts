import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { BackToTopComponent } from '../../components/back-to-top/back-to-top';
import { BlogBreadcrumbsComponent } from '../../components/blog-breadcrumbs/blog-breadcrumbs';
import { GiscusCommentsComponent } from '../../components/giscus-comments/giscus-comments';
import { PostCitationComponent } from '../../components/post-citation/post-citation';
import { PostHeaderComponent } from '../../components/post-header/post-header';
import { PostNavigationComponent } from '../../components/post-navigation/post-navigation';
import { BLOG_CONFIG } from '../../data/blog-config';
import { COMMENTS_CONFIG } from '../../data/comments-config';
import { PostContentDirective } from '../../directives/post-content';
import type { Post } from '../../models/post.model';
import { parentBlogSlug } from '../../utils/blog-directories';
import { NotFoundComponent } from '../not-found/not-found';

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
  templateUrl: './post.html',
  styleUrls: [
    './styles/typography.css',
    './styles/code-blocks.css',
    './styles/tables.css',
    './styles/media.css',
    './styles/media/attention-heads.css',
    './styles/media/mla.css',
    './styles/media/collectives.css',
    './styles/media/zero.css',
    './styles/media/zero-flow.css',
    './styles/media/fsdp.css',
    './styles/media/paged-attention.css',
    './styles/media/muon.css',
    './styles/media/ssl.css',
    './styles/media/flash-attention.css',
    './styles/media/flash-forward-player.css',
    './styles/media/cf351d-pointers.css',
    './styles/media/cf391f3-trading.css',
    './styles/media/cf434d-flow.css',
    './styles/media/cf77c-tree.css',
    './styles/layout.css',
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class PostComponent {
  readonly showCitation = BLOG_CONFIG.showCitation;
  readonly commentsEnabled = COMMENTS_CONFIG.enabled;
  private readonly route = inject(ActivatedRoute);
  readonly post = toSignal(this.route.data.pipe(map((data) => data['post'] as Post | null)), {
    initialValue: null,
  });
  readonly content = viewChild(PostContentDirective);
  readonly postPath = computed(() => `/blog/${this.post()?.slug ?? ''}`);
  readonly parentSlug = computed(() => parentBlogSlug(this.post()?.slug ?? ''));
}
