import { expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { POSTS } from '../src/app/data/posts';
import { SITE_CONFIG } from '../src/app/data/site-config';
import { test } from './fixtures';

const autoregressive = POSTS.find((post) => post.slug === 'ml/ml-revisit/ar')!;

const diffusion = POSTS.find((post) => post.slug === 'ml/ml-revisit/diffusion')!;

test('prerendered HTML contains article metadata and missing routes return the 404 page', async ({
  request,
  page,
}) => {
  for (const post of [diffusion, autoregressive]) {
    const response = await request.get(`/blog/${post.slug}`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`<title>${post.title} — ${SITE_CONFIG.author.name}</title>`);
    expect(html).toContain(`content="${post.description ?? SITE_CONFIG.description}"`);
    expect(html).toContain(`href="${SITE_CONFIG.url}/blog/${post.slug}"`);
    expect(html).toContain('property="og:type" content="article"');
    expect(html).not.toContain('<script id="MathJax-script"');
    const dom = new JSDOM(html);
    const scripts = dom.window.document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(1);
    expect(JSON.parse(scripts[0]!.textContent!)).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      ...(post.description ? { description: post.description } : {}),
      datePublished: post.date,
      author: [{ '@type': 'Person', name: SITE_CONFIG.author.name, url: `${SITE_CONFIG.url}/` }],
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_CONFIG.url}/blog/${post.slug}` },
    });
    dom.window.close();
  }
  const missing = await request.get('/blog/this-post-does-not-exist');
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('noindex, follow');
  await page.goto('/blog/this-post-does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    '404: Existence Left as an Exercise',
  );
  await expect(page).toHaveTitle('404: Existence Left as an Exercise');
  await expect(page.locator('#article-structured-data')).toHaveCount(0);
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page).toHaveTitle(SITE_CONFIG.author.name);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
});
