import { DOCUMENT } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type ActivatedRouteSnapshot, provideRouter, TitleStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SITE_CONFIG } from '../data/site-config';
import { PERSON_DATA } from '../data/person';
import type { Post } from '../models/post.model';
import { PageMetadataStrategy } from './page-metadata.strategy';

@Component({ template: '' })
class MetadataTestPage {}

const first: Post = {
  slug: 'first',
  title: 'Attention </script><script id="unexpected-script">example</script>',
  description: 'Quotes "and" 中文 <examples> & equations',
  date: '2026-09-07',
  updated: '2026-09-08',
  coverImage: '/posts/first/cover.avif',
  contentHtml: '<p>Example</p>',
  toc: [],
};
const second: Post = {
  slug: 'second',
  title: 'Another article',
  description: 'An article without a cover',
  date: '2026-09-08',
  contentHtml: '<p>Another example</p>',
  toc: [],
};
const fixturePosts: Record<string, Post> = { first, second };

describe('article structured data', () => {
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: MetadataTestPage },
          { path: 'cv', component: MetadataTestPage },
          { path: 'pdf-viewer', component: MetadataTestPage, data: { noindex: true } },
          { path: 'blog', component: MetadataTestPage },
          {
            path: 'blog/contents/topic/nested', component: MetadataTestPage,
            title: 'nested — Example',
            data: { directory: { slug: 'topic/nested' }, description: 'Browse nested posts.' },
          },
          {
            path: 'blog/contents', component: MetadataTestPage, title: 'Contents — Example',
            data: { directory: { slug: '' } },
          },
          {
            path: 'blog/:slug',
            component: MetadataTestPage,
            resolve: {
              post: (route: ActivatedRouteSnapshot) => fixturePosts[route.paramMap.get('slug') ?? ''] ?? null,
            },
          },
        ]),
        { provide: TitleStrategy, useClass: PageMetadataStrategy },
      ],
    });
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => document.head.querySelectorAll('#article-structured-data, #profile-structured-data').forEach(node => node.remove()));

  it('replaces article metadata with indexable directory metadata and its Markdown index', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/blog/first');
    await harness.navigateByUrl('/blog/contents/topic/nested');
    expect(document.title).toBe('nested — Example');
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('index, follow');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Browse nested posts.');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_CONFIG.url}/blog/contents/topic/nested`);
    expect(document.querySelector('link[type="text/markdown"]')?.getAttribute('href')).toBe(`${SITE_CONFIG.url}/blog/contents/topic/nested/index.md`);
    expect(document.querySelector('#article-structured-data')).toBeNull();
    expect(document.querySelector('meta[property="article:modified_time"]')).toBeNull();
    await harness.navigateByUrl('/blog/contents');
    expect(document.title).toBe('Contents — Example');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_CONFIG.url}/blog/contents`);
    expect(document.querySelector('link[type="text/markdown"]')?.getAttribute('href')).toBe(`${SITE_CONFIG.url}/blog/contents/index.md`);
  });

  it('describes the article and preserves authored text when HTML is serialized and parsed again', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/blog/first?source=search#example');
    const script = document.head.querySelector<HTMLScriptElement>('#article-structured-data')!;
    expect(script.type).toBe('application/ld+json');
    const canonical = `${SITE_CONFIG.url}/blog/first`;
    const data = JSON.parse(script.textContent!);
    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': `${canonical}#article`,
      url: canonical,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      headline: first.title,
      description: first.description,
      datePublished: first.date,
      dateModified: first.updated,
      author: [{ '@type': 'Person', '@id': PERSON_DATA['@id'], name: SITE_CONFIG.author.name, url: `${SITE_CONFIG.url}/` }],
      image: [`${SITE_CONFIG.url}${first.coverImage}`],
    });
    const reparsed = new DOMParser().parseFromString(script.outerHTML, 'text/html');
    expect(reparsed.querySelectorAll('script')).toHaveLength(1);
    expect(reparsed.querySelector('#unexpected-script')).toBeNull();
    expect(JSON.parse(reparsed.querySelector('script')!.textContent!)).toEqual(data);
  });

  it('reuses prerendered markup, updates it between posts and removes it on other routes', async () => {
    const harness = await RouterTestingHarness.create();
    const prerendered = document.createElement('script');
    prerendered.id = 'article-structured-data';
    prerendered.type = 'application/ld+json';
    prerendered.textContent = '{}';
    document.head.appendChild(prerendered);

    await harness.navigateByUrl('/blog/first');
    expect(document.head.querySelector('#article-structured-data')).toBe(prerendered);
    expect(document.head.querySelector('meta[property="article:modified_time"]')?.getAttribute('content')).toBe(first.updated);
    await harness.navigateByUrl('/blog/second');
    expect(document.head.querySelectorAll('#article-structured-data')).toHaveLength(1);
    const data = JSON.parse(prerendered.textContent!);
    expect(data.headline).toBe(second.title);
    expect(data.datePublished).toBe(second.date);
    expect(data.url).toBe(`${SITE_CONFIG.url}/blog/second`);
    expect(data).not.toHaveProperty('image');
    expect(data).not.toHaveProperty('dateModified');
    expect(document.head.querySelector('meta[property="article:modified_time"]')).toBeNull();

    await harness.navigateByUrl('/blog');
    expect(document.head.querySelector('#article-structured-data')).toBeNull();
    await harness.navigateByUrl('/blog/first');
    await harness.navigateByUrl('/blog/missing');
    expect(document.head.querySelector('#article-structured-data')).toBeNull();
    await harness.navigateByUrl('/');
    expect(document.head.querySelector('#article-structured-data')).toBeNull();
  });

  it('connects home and CV to one person and removes profile markup on other routes', async () => {
    const harness = await RouterTestingHarness.create();
    for (const path of ['/', '/cv']) {
      await harness.navigateByUrl(path);
      const scripts = document.head.querySelectorAll('#profile-structured-data');
      expect(scripts).toHaveLength(1);
      const data = JSON.parse(scripts[0].textContent!);
      expect(data['@type']).toBe('ProfilePage');
      expect(data.url).toBe(`${SITE_CONFIG.url}${path}`);
      expect(data.mainEntity).toEqual(PERSON_DATA);
    }
    for (const path of ['/blog/first', '/blog/missing', '/pdf-viewer']) {
      await harness.navigateByUrl(path);
      expect(document.head.querySelector('#profile-structured-data')).toBeNull();
    }
  });

  it('advertises Markdown equivalents and clears stale links on missing or noindex pages', async () => {
    const harness = await RouterTestingHarness.create();
    const alternate = () => document.head.querySelector<HTMLLinkElement>('link[rel="alternate"][type="text/markdown"]');
    const guide = () => document.head.querySelector<HTMLLinkElement>('link[rel="describedby"][type="text/plain"]');
    for (const [route, markdown] of [
      ['/', '/profile.md'],
      ['/cv', '/profile.md'],
      ['/blog', '/blog/index.md'],
      ['/blog/first?source=search#example', '/blog/first.md'],
      ['/blog/second', '/blog/second.md'],
    ]) {
      await harness.navigateByUrl(route);
      expect(alternate()?.href).toBe(`${SITE_CONFIG.url}${markdown}`);
      expect(guide()?.href).toBe(`${SITE_CONFIG.url}/llms.txt`);
      expect(document.head.querySelectorAll('link[rel="alternate"][type="text/markdown"]')).toHaveLength(1);
      expect(document.head.querySelector('link[rel="alternate"][type="application/rss+xml"]')?.getAttribute('href')).toBe(`${SITE_CONFIG.url}/feed.xml`);
      expect(document.head.querySelector('link[rel="alternate"][type="application/atom+xml"]')?.getAttribute('href')).toBe(`${SITE_CONFIG.url}/atom.xml`);
    }
    for (const route of ['/blog/missing', '/pdf-viewer']) {
      await harness.navigateByUrl(route);
      expect(alternate()).toBeNull();
      expect(guide()).toBeNull();
      expect(document.head.querySelector('link[type="application/rss+xml"]')).toBeNull();
      expect(document.head.querySelector('link[type="application/atom+xml"]')).toBeNull();
    }
  });
});
