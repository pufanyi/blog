import { Routes } from '@angular/router';
import { REDIRECTS } from './data/redirects';

const redirectRoutes: Routes = REDIRECTS.map(r => ({
  path: r.from,
  loadComponent: () =>
    import('./pages/redirect/redirect').then(m => m.RedirectComponent),
}));

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/blog-shell/blog-shell').then(m => m.BlogShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/cv/cv').then(m => m.CvPageComponent),
      },
      {
        path: 'blog',
        loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent),
      },
      {
        path: 'blog/:slug',
        loadComponent: () => import('./pages/post/post').then(m => m.PostComponent),
      },
      ...redirectRoutes,
    ],
  },
  { path: '**', redirectTo: '' },
];
