import { ResolveFn, Routes } from '@angular/router';
import { blogDirectoryPath, buildBlogDirectories } from '../../../contracts/blog-directories';
import type { BlogPage } from '../../../contracts/blog-pagination';
import { BLOG_REDIRECTS } from '../../../contracts/blog-redirects';
import { BLOG_CONFIG } from '../../data/blog-config';
import { POSTS } from '../../data/posts';
import { SITE_CONFIG } from '../../data/site-config';
import { readerRoutes } from '../reader/reader.routes';

const resolveBlogPage: ResolveFn<BlogPage | null> = (route) =>
  import('./data/blog-repository').then((module) =>
    module.loadBlogPage(route.paramMap.get('page')),
  );
const loadBlogComponent = () => import('./archive/archive').then((m) => m.BlogArchiveComponent);

export const blogRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: SITE_CONFIG.title,
    data: { description: BLOG_CONFIG.description },
    resolve: { blogPage: resolveBlogPage },
    loadComponent: loadBlogComponent,
  },
  { path: 'page/1', pathMatch: 'full', redirectTo: '/blog' },
  ...BLOG_REDIRECTS.map((redirect) => ({ ...redirect, pathMatch: 'full' as const })),
  {
    path: 'page/:page',
    title: SITE_CONFIG.title,
    data: { description: BLOG_CONFIG.description },
    resolve: { blogPage: resolveBlogPage },
    loadComponent: loadBlogComponent,
  },
  ...buildBlogDirectories(POSTS).map((directory) => ({
    path: blogDirectoryPath(directory.slug).slice('/blog/'.length),
    pathMatch: 'full' as const,
    title: `${directory.name} — ${SITE_CONFIG.author.name}`,
    data: {
      directory,
      description: directory.slug
        ? `Browse ${directory.postCount} posts in ${directory.slug}.`
        : `Browse all ${directory.postCount} posts by directory.`,
    },
    loadComponent: () => import('./directory/blog-directory').then((m) => m.BlogDirectoryComponent),
  })),
  ...readerRoutes,
  {
    path: '**',
    title: '404: Existence Left as an Exercise',
    loadComponent: () =>
      import('../../shared/ui/not-found/not-found').then((m) => m.NotFoundPageComponent),
  },
];
