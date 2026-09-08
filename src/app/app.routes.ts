import { ResolveFn, Routes } from '@angular/router';
import { REDIRECTS } from './data/redirects';
import type { Post } from './models/post.model';
import { BLOG_CONFIG } from './data/blog-config';
import { SITE_CONFIG } from './data/site-config';
import type { BlogPage } from './utils/blog-pagination';

const resolveBlogPage: ResolveFn<BlogPage | null> = route =>
  import('./services/blog-repository').then(module => module.loadBlogPage(route.paramMap.get('page')));
const loadBlogComponent = () => import('./pages/home/home').then(m => m.HomeComponent);

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
        title: SITE_CONFIG.title,
        data: { description: BLOG_CONFIG.description },
        resolve: { blogPage: resolveBlogPage },
        loadComponent: loadBlogComponent,
      },
      {
        path: 'blog/page/1',
        pathMatch: 'full',
        redirectTo: '/blog',
      },
      {
        path: 'blog/page/:page',
        title: SITE_CONFIG.title,
        data: { description: BLOG_CONFIG.description },
        resolve: { blogPage: resolveBlogPage },
        loadComponent: loadBlogComponent,
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
