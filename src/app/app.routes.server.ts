import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
import { POSTS } from './data/posts';
import { BLOG_CONFIG } from './data/blog-config';
import { blogPageCount } from './utils/blog-pagination';
import { blogDirectoryPath, buildBlogDirectories } from './utils/blog-directories';
import { BLOG_REDIRECTS } from './utils/blog-redirects';

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
  ...BLOG_REDIRECTS.map(redirect => ({
    path: `blog/${redirect.path}`,
    renderMode: RenderMode.Prerender as const,
  })),
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
  ...[
    ...buildBlogDirectories(POSTS).map(directory => blogDirectoryPath(directory.slug).slice(1)),
    ...POSTS.map(post => `blog/${post.slug}`),
  ].map(path => ({
    path,
    renderMode: RenderMode.Prerender as const,
  })),
  {
    path: '404',
    renderMode: RenderMode.Prerender,
  },
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
