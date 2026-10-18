import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
import { blogDirectoryPath, buildBlogDirectories } from '../contracts/blog-directories';
import { blogPageCount } from '../contracts/blog-pagination';
import { BLOG_REDIRECTS } from '../contracts/blog-redirects';
import { docPath } from '../contracts/doc.model';
import { BLOG_CONFIG } from './data/blog-config';
import { DOCS } from './data/docs';
import { POST_ROUTES } from './data/post-routes';
import { POSTS } from './data/posts';

export const serverRoutes: ServerRoute[] = [
  ...DOCS.map((doc) => ({
    path: docPath(doc.slug).slice(1),
    renderMode: RenderMode.Prerender as const,
  })),
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
  ...BLOG_REDIRECTS.map((redirect) => ({
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
    ...buildBlogDirectories(POSTS).map((directory) => blogDirectoryPath(directory.slug).slice(1)),
    ...POST_ROUTES.map((post) => `blog/${post.slug}`),
  ].map((path) => ({
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
