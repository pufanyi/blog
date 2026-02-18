import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';
import { POSTS } from './data/posts';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'post/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.None,
    async getPrerenderParams() {
      return POSTS.map(post => ({ slug: post.slug }));
    },
  },
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
