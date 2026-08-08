import { Routes } from '@angular/router';
import { REDIRECTS } from './data/redirects';

const redirectRoutes: Routes = REDIRECTS.map(r => ({
  path: r.from,
  children: [
    {
      path: '**',
      loadComponent: () =>
        import('./pages/redirect/redirect').then(m => m.RedirectComponent),
      data: { redirect: r },
    },
  ],
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
        title: 'Fanyi Pu',
        loadComponent: () =>
          import('./pages/profile/profile').then(m => m.ProfilePageComponent),
      },
      {
        path: 'cv',
        title: 'Fanyi Pu — CV',
        loadComponent: () => import('./pages/cv/cv').then(m => m.CvPageComponent),
      },
      {
        path: 'icpc',
        title: 'My ICPC Teammates — Fanyi Pu',
        loadComponent: () =>
          import('./pages/icpc/icpc').then(m => m.IcpcPageComponent),
      },
      {
        path: 'blog',
        title: "Fanyi's Blog",
        loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent),
      },
      {
        path: 'blog/:slug',
        loadComponent: () => import('./pages/post/post').then(m => m.PostComponent),
      },
      ...redirectRoutes,
      {
        path: '**',
        loadComponent: () =>
          import('./pages/not-found/not-found').then(m => m.NotFoundComponent),
      },
    ],
  },
];
