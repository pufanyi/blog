import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';

describe('application routes', () => {
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
});
