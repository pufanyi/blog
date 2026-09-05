import { ResolveFn, Routes } from '@angular/router';
import { REDIRECTS } from './data/redirects';
import type { Post } from './models/post.model';

const resolvePost: ResolveFn<Post | null> = route =>
  import('./services/post-repository').then(module =>
    module.loadPost(route.paramMap.get('slug') ?? ''),
  );

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
    path: '',
    loadComponent: () =>
      import('./components/blog-shell/blog-shell').then(m => m.BlogShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Fanyi Pu',
        data: { description: 'Research, background, and writing by Fanyi Pu.' },
        loadComponent: () => import('./pages/profile/profile').then(m => m.ProfilePageComponent),
      },
      {
        path: 'cv',
        title: 'Fanyi Pu — CV',
        data: { description: 'Curriculum vitae of Fanyi Pu.' },
        loadComponent: () => import('./pages/cv/cv').then(m => m.CvPageComponent),
      },
      {
        path: 'icpc',
        title: 'My ICPC Teammates — Fanyi Pu',
        data: { description: 'My friends and teammates in ICPC.' },
        loadComponent: () => import('./pages/icpc/icpc').then(m => m.IcpcPageComponent),
      },
      {
        path: 'blog',
        title: "Fanyi's Blog",
        data: { description: 'Notes, derivations, and contest scraps by Fanyi Pu.' },
        loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent),
      },
      {
        path: 'blog/:slug',
        resolve: { post: resolvePost },
        loadComponent: () => import('./pages/post/post').then(m => m.PostComponent),
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
