import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
import { POSTS } from './data/posts';
import { REDIRECTS } from './data/redirects';

const redirectServerRoutes: ServerRoute[] = REDIRECTS.map(r => ({
  path: r.from,
  renderMode: RenderMode.Prerender,
}));

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'blog',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.None,
    async getPrerenderParams() {
      return POSTS.map(post => ({ slug: post.slug }));
    },
  },
  ...redirectServerRoutes,
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
