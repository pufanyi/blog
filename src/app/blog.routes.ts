import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { BLOG_CONFIG } from './data/blog-config';
import { POSTS } from './data/posts';
import { SITE_CONFIG } from './data/site-config';
import type { Post, PostTocItem } from './models/post.model';
import { blogDirectoryPath, buildBlogDirectories } from './utils/blog-directories';
import type { BlogPage } from './utils/blog-pagination';
import { BLOG_REDIRECTS } from './utils/blog-redirects';

const resolveBlogPage: ResolveFn<BlogPage | null> = (route) =>
  import('./services/blog-repository').then((module) =>
    module.loadBlogPage(route.paramMap.get('page')),
  );
const loadBlogComponent = () => import('./pages/home/home').then((m) => m.HomeComponent);
const resolvePost: ResolveFn<Post | null> = (route) => {
  const slug = route.data['slug'] as string;
  const state = inject(TransferState);
  const key = makeStateKey<PostTocItem[]>(`post-toc:${slug}`);
  const browser = isPlatformBrowser(inject(PLATFORM_ID));
  const article = inject(DOCUMENT).querySelector<HTMLElement>('.post-body[data-post-slug]');
  if (browser && state.hasKey(key)) {
    const toc = state.get(key, []);
    state.remove(key);
    const summary = POSTS.find((post) => post.slug === slug);
    if (summary && article?.dataset['postSlug'] === slug) {
      return { ...summary, contentHtml: '', toc, prerendered: true };
    }
  }
  return import('./services/post-repository').then(async (module) => {
    const post = await module.loadPost(slug);
    if (!browser && post) state.set(key, post.toc);
    return post;
  });
};

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
    loadComponent: () =>
      import('./pages/blog-directory/blog-directory').then((m) => m.BlogDirectoryComponent),
  })),
  ...POSTS.map((post) => ({
    path: post.slug,
    pathMatch: 'full' as const,
    data: { slug: post.slug },
    resolve: { post: resolvePost },
    loadComponent: () => import('./pages/post/post').then((m) => m.PostComponent),
  })),
  {
    path: '**',
    title: '404: Existence Left as an Exercise',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
