import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
import { POSTS } from './data/posts';
import { BLOG_CONFIG } from './data/blog-config';
import { blogPageCount } from './utils/blog-pagination';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'pdf-viewer',
    renderMode: RenderMode.Prerender,
  },
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'cv',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'icpc',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'blog',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'blog/page/1',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'blog/page/:page',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.None,
    async getPrerenderParams() {
      return Array.from(
        { length: blogPageCount(POSTS.length, BLOG_CONFIG.postsPerPage) - 1 },
        (_, index) => ({ page: String(index + 2) }),
      );
    },
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.None,
    async getPrerenderParams() {
      return POSTS.map(post => ({ slug: post.slug }));
    },
  },
  {
    path: '404',
    renderMode: RenderMode.Prerender,
  },
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
