import { RenderMode } from '@angular/ssr';
import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';
import { BLOG_CONFIG } from './data/blog-config';
import { POSTS } from './data/posts';
import { blogPageCount } from './utils/blog-pagination';
import { blogDirectoryPath, buildBlogDirectories } from './utils/blog-directories';
import { blogRoutes } from './blog.routes';

describe('application routes', () => {
  it('routes and prerenders every published article and ancestor directory at its full path', () => {
    const paths = [
      ...POSTS.map(post => `/blog/${post.slug}`),
      ...buildBlogDirectories(POSTS).map(directory => blogDirectoryPath(directory.slug)),
    ];
    for (const path of paths) {
      expect(blogRoutes.find(route => route.path === path.slice('/blog/'.length))?.pathMatch).toBe('full');
      expect(serverRoutes).toContainEqual({ path: path.slice(1), renderMode: RenderMode.Prerender });
    }
    expect(blogRoutes.find(route => route.path === 'contents')?.data?.['directory'].name).toBe('Contents');
    expect(blogRoutes.find(route => route.path === 'oi-icpc/codeforces/cf551c')?.data?.['slug']).toBe('oi-icpc/codeforces/cf551c');
    expect(blogRoutes.at(-1)?.path).toBe('**');
  });
  it('prerenders every archive page using the configured page size', async () => {
    const route = serverRoutes.find(route => route.path === 'blog/page/:page');
    if (!route || !('getPrerenderParams' in route)) throw new Error('Missing paginated archive route');
    const pages = await route.getPrerenderParams();
    expect(pages).toEqual(Array.from({ length: blogPageCount(POSTS.length, BLOG_CONFIG.postsPerPage) - 1 }, (_, index) => ({ page: String(index + 2) })));
    expect(serverRoutes).toContainEqual({ path: 'blog', renderMode: RenderMode.Prerender });
  });
  it('uses the concise profile at / and keeps the full CV at /cv', async () => {
    const shellRoute = routes.find(route => route.path === '' && route.children);
    const homeRoute = shellRoute?.children?.find(route => route.path === '');
    const cvRoute = shellRoute?.children?.find(route => route.path === 'cv');

    expect(homeRoute?.pathMatch).toBe('full');
    expect(homeRoute?.loadComponent).toBeTypeOf('function');
    expect(cvRoute?.loadComponent).toBeTypeOf('function');

    const loadedHomeComponent = await homeRoute?.loadComponent?.();
    const loadedCvComponent = await cvRoute?.loadComponent?.();
    const { ProfilePageComponent } = await import('./pages/profile/profile');
    const { CvPageComponent } = await import('./pages/cv/cv');

    expect(loadedHomeComponent).toBe(ProfilePageComponent);
    expect(loadedCvComponent).toBe(CvPageComponent);
    expect(loadedHomeComponent).not.toBe(loadedCvComponent);
  });

  it('prerenders both public profile routes', () => {
    const prerenderedPaths = serverRoutes.map(route => route.path);

    expect(prerenderedPaths).toContain('');
    expect(prerenderedPaths).toContain('cv');
  });

  it('serves and prerenders the migrated ICPC page', async () => {
    const shellRoute = routes.find(route => route.path === '' && route.children);
    const icpcRoute = shellRoute?.children?.find(route => route.path === 'icpc');

    expect(icpcRoute?.loadComponent).toBeTypeOf('function');

    const loadedIcpcComponent = await icpcRoute?.loadComponent?.();
    const { IcpcPageComponent } = await import('./pages/icpc/icpc');

    expect(loadedIcpcComponent).toBe(IcpcPageComponent);
    expect(serverRoutes.map(route => route.path)).toContain('icpc');
  });

  it('serves and prerenders a dedicated custom 404 document', async () => {
    const shellRoute = routes.find(route => route.path === '' && route.children);
    const notFoundRoute = shellRoute?.children?.find(route => route.path === '404');
    const fallbackRoute = shellRoute?.children?.find(route => route.path === '**');

    expect(await notFoundRoute?.loadComponent?.()).toBe(await fallbackRoute?.loadComponent?.());
    expect(serverRoutes).toContainEqual({ path: '404', renderMode: RenderMode.Prerender });
  });
});
