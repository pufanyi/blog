import type { Routes } from '@angular/router';
import { POST_ROUTES, PRIVATE_POST_SLUGS } from '../../data/post-routes';
import { resolvePost } from './data/post-resolver';

export const readerRoutes: Routes = POST_ROUTES.map((post) => ({
  path: post.slug,
  pathMatch: 'full' as const,
  data: { slug: post.slug, noindex: PRIVATE_POST_SLUGS.has(post.slug) },
  resolve: { post: resolvePost },
  loadComponent: () => import('./reader-page').then((m) => m.ReaderPageComponent),
}));
