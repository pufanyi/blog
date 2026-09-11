import { Routes } from '@angular/router';
import { REDIRECTS } from './data/redirects';
import { SITE_CONFIG } from './data/site-config';

const NOT_FOUND_TITLE = '404: Existence Left as an Exercise';
const loadNotFoundComponent = () =>
  import('./pages/not-found/not-found').then(m => m.NotFoundComponent);

const redirectRoutes: Routes = REDIRECTS.map(r => ({
  path: r.from,
  children: [
    {
      path: '**',
      loadComponent: () => import('./pages/redirect/redirect').then(m => m.RedirectComponent),
      data: { redirect: r },
    },
  ],
}));

export const routes: Routes = [
  {
    path: 'pdf-viewer',
    title: 'PDF viewer',
    data: { noindex: true, description: 'Embedded PDF reader.' },
    loadComponent: () => import('./pages/pdf-viewer/pdf-viewer').then(m => m.PdfViewerComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./components/blog-shell/blog-shell').then(m => m.BlogShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: SITE_CONFIG.author.name,
        data: { description: `Research, background, and writing by ${SITE_CONFIG.author.name}.` },
        loadComponent: () => import('./pages/profile/profile').then(m => m.ProfilePageComponent),
      },
      {
        path: 'cv',
        title: `${SITE_CONFIG.author.name} — CV`,
        data: { description: `Curriculum vitae of ${SITE_CONFIG.author.name}.` },
        loadComponent: () => import('./pages/cv/cv').then(m => m.CvPageComponent),
      },
      {
        path: 'icpc',
        title: `My ICPC Teammates — ${SITE_CONFIG.author.name}`,
        data: { description: 'My friends and teammates in ICPC.' },
        loadComponent: () => import('./pages/icpc/icpc').then(m => m.IcpcPageComponent),
      },
      {
        path: 'blog',
        loadChildren: () => import('./blog.routes').then(m => m.blogRoutes),
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
