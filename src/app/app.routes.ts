import { Routes } from '@angular/router';
import { REDIRECTS } from './data/redirects';
import { SITE_CONFIG } from './data/site-config';

const NOT_FOUND_TITLE = '404: Existence Left as an Exercise';
const loadNotFoundComponent = () =>
  import('./shared/ui/not-found/not-found').then((m) => m.NotFoundPageComponent);

const redirectRoutes: Routes = REDIRECTS.map((r) => ({
  path: r.from,
  children: [
    {
      path: '**',
      loadComponent: () => import('./features/redirect/redirect').then((m) => m.RedirectComponent),
      data: { redirect: r },
    },
  ],
}));

export const routes: Routes = [
  {
    path: 'pdf-viewer',
    title: 'PDF viewer',
    data: { noindex: true, description: 'Embedded PDF reader.' },
    loadComponent: () =>
      import('./features/pdf-viewer/pdf-viewer').then((m) => m.PdfViewerComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shell/site-shell').then((m) => m.SiteShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: SITE_CONFIG.author.name,
        data: { description: `Research, background, and writing by ${SITE_CONFIG.author.name}.` },
        loadComponent: () =>
          import('./features/profile/profile').then((m) => m.ProfilePageComponent),
      },
      {
        path: 'cv',
        title: `${SITE_CONFIG.author.name} — CV`,
        data: { description: `Curriculum vitae of ${SITE_CONFIG.author.name}.` },
        loadComponent: () => import('./features/cv/cv').then((m) => m.CvPageComponent),
      },
      {
        path: 'icpc',
        title: `My ICPC Teammates — ${SITE_CONFIG.author.name}`,
        data: { description: 'My friends and teammates in ICPC.' },
        loadComponent: () => import('./features/icpc/icpc').then((m) => m.IcpcPageComponent),
      },
      {
        path: 'docs',
        loadChildren: () => import('./features/docs/docs.routes').then((m) => m.docsRoutes),
      },
      {
        path: 'blog',
        loadChildren: () => import('./features/blog/blog.routes').then((m) => m.blogRoutes),
      },
      {
        path: '404',
        title: NOT_FOUND_TITLE,
        loadComponent: loadNotFoundComponent,
      },
      ...redirectRoutes,
      {
        path: '**',
        title: NOT_FOUND_TITLE,
        loadComponent: loadNotFoundComponent,
      },
    ],
  },
];
