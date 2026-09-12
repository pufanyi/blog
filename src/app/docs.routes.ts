import type { Routes } from '@angular/router';
import { DOC_LOADERS } from './data/doc-loaders';
import { DOCS } from './data/docs';
import { SITE_CONFIG } from './data/site-config';

export const docsRoutes: Routes = [
  ...DOCS.map((doc) => ({
    path: doc.slug,
    pathMatch: 'full' as const,
    title: `${doc.title} — Documentation — ${SITE_CONFIG.author.name}`,
    data: { description: doc.description },
    resolve: { doc: async () => ({ ...doc, ...(await DOC_LOADERS.get(doc.slug)!()) }) },
    loadComponent: () => import('./pages/docs/docs').then((m) => m.DocsComponent),
  })),
  {
    path: '**',
    title: '404: Existence Left as an Exercise',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
