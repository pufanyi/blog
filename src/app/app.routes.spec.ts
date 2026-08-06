import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

describe('application routes', () => {
  it('uses the CV page as the homepage and preserves the old /cv URL', async () => {
    const legacyCvRoute = routes.find(route => route.path === 'cv');

    expect(legacyCvRoute?.redirectTo).toBe('');
    expect(legacyCvRoute?.pathMatch).toBe('full');

    const shellRoute = routes.find(route => route.path === '' && route.children);
    const homeRoute = shellRoute?.children?.find(route => route.path === '');

    expect(homeRoute?.pathMatch).toBe('full');
    expect(homeRoute?.loadComponent).toBeTypeOf('function');

    const loadedHomeComponent = await homeRoute?.loadComponent?.();
    const { CvPageComponent } = await import('./pages/cv/cv');

    expect(loadedHomeComponent).toBe(CvPageComponent);
  });
});
