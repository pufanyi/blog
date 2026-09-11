import { ResolveFn, Routes } from '@angular/router';
import { BLOG_CONFIG } from './data/blog-config';
import { POSTS } from './data/posts';
import { SITE_CONFIG } from './data/site-config';
import type { Post } from './models/post.model';
import { blogDirectoryPath, buildBlogDirectories } from './utils/blog-directories';
import type { BlogPage } from './utils/blog-pagination';

const resolveBlogPage: ResolveFn<BlogPage | null> = route =>
  import('./services/blog-repository').then(module => module.loadBlogPage(route.paramMap.get('page')));
const loadBlogComponent = () => import('./pages/home/home').then(m => m.HomeComponent);
const resolvePost: ResolveFn<Post | null> = route =>
  import('./services/post-repository').then(module => module.loadPost(route.data['slug']));

export const blogRoutes: Routes = [
  {
    path: '', pathMatch: 'full', title: SITE_CONFIG.title,
    data: { description: BLOG_CONFIG.description },
    resolve: { blogPage: resolveBlogPage }, loadComponent: loadBlogComponent,
  },
  { path: 'page/1', pathMatch: 'full', redirectTo: '/blog' },
  {
    path: 'page/:page', title: SITE_CONFIG.title,
    data: { description: BLOG_CONFIG.description },
    resolve: { blogPage: resolveBlogPage }, loadComponent: loadBlogComponent,
  },
  ...buildBlogDirectories(POSTS).map(directory => ({
    path: blogDirectoryPath(directory.slug).slice('/blog/'.length), pathMatch: 'full' as const,
    title: `${directory.name} — ${SITE_CONFIG.author.name}`,
    data: { directory, description: directory.slug
      ? `Browse ${directory.postCount} posts in ${directory.slug}.`
      : `Browse all ${directory.postCount} posts by directory.` },
    loadComponent: () => import('./pages/blog-directory/blog-directory').then(m => m.BlogDirectoryComponent),
  })),
  ...POSTS.map(post => ({
    path: post.slug, pathMatch: 'full' as const,
    data: { slug: post.slug }, resolve: { post: resolvePost },
    loadComponent: () => import('./pages/post/post').then(m => m.PostComponent),
  })),
  {
    path: '**', title: '404: Existence Left as an Exercise',
    loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFoundComponent),
  },
];
