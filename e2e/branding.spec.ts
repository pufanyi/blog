import { expect } from '@playwright/test';
import { imageSize } from 'image-size';
import { JSDOM } from 'jsdom';
import { CV_DATA } from '../src/app/data/cv';
import { SITE_CONFIG } from '../src/app/data/site-config';
import { test } from './fixtures';

test('site avatar appears in navigation and metadata while introductions keep the real portrait', async ({
  page,
  request,
}, testInfo) => {
  for (const path of ['/', '/cv', '/blog']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const dom = new JSDOM(await response.text());
    const document = dom.window.document;
    expect(document.querySelector('.toolbar-avatar')?.getAttribute('src')).toBe(
      SITE_CONFIG.author.avatar,
    );
    for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
      expect(document.querySelector(selector)?.getAttribute('content')).toBe(
        new URL(SITE_CONFIG.defaultImage, SITE_CONFIG.url).href,
      );
    }
    if (path !== '/blog') {
      expect(document.querySelector('.author-photo')?.getAttribute('src')).toBe(
        CV_DATA.header.photo,
      );
      const profile = JSON.parse(document.querySelector('#profile-structured-data')!.textContent!);
      expect(profile.mainEntity.image).toBe(
        new URL(SITE_CONFIG.author.avatar, SITE_CONFIG.url).href,
      );
    }
    dom.window.close();
  }

  await page.goto('/cv');
  const home = page.locator('app-toolbar').getByRole('link', { name: 'Home', exact: true });
  const avatar = home.locator('img');
  await expect(avatar).toHaveAttribute('src', SITE_CONFIG.author.avatar);
  await expect(avatar).toBeVisible();
  await expect
    .poll(() => avatar.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  await expect(home.locator('[role="button"], [tabindex]')).toHaveCount(0);
  await expect(page.locator('.author-photo')).toHaveAttribute('src', CV_DATA.header.photo);
  expect(CV_DATA.header.photo).not.toBe(SITE_CONFIG.author.avatar);
  await avatar.click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('.medium-zoom-overlay')).toHaveCount(0);
  await expect(page.locator('.author-photo')).toBeVisible();
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await page.screenshot({
      path: testInfo.outputPath(`avatar-${theme}.png`),
      animations: 'disabled',
    });
  }

  for (const [path, size] of [
    [SITE_CONFIG.author.avatar, 192],
    [SITE_CONFIG.defaultImage, 512],
    [await page.locator('link[rel="icon"]').getAttribute('href'), 32],
    [await page.locator('link[rel="apple-touch-icon"]').getAttribute('href'), 180],
  ] as const) {
    const response = await request.get(path!);
    expect(response.status()).toBe(200);
    const dimensions = imageSize(await response.body());
    expect(dimensions).toMatchObject({ width: size, height: size });
  }
});
