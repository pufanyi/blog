import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/cv/cv').then(m => m.CvPageComponent),
  },
  {
    path: 'blog',
    loadComponent: () =>
      import('./components/blog-shell/blog-shell').then(m => m.BlogShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent),
      },
      {
        path: ':slug',
        loadComponent: () => import('./pages/post/post').then(m => m.PostComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
