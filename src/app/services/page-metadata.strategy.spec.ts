import { DOCUMENT } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type ActivatedRouteSnapshot, provideRouter, TitleStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SITE_CONFIG } from '../data/site-config';
import type { Post } from '../models/post.model';
import { PageMetadataStrategy } from './page-metadata.strategy';

@Component({ template: '' })
class MetadataTestPage {}

const first: Post = {
  slug: 'first',
  title: 'Attention </script><script id="unexpected-script">example</script>',
  description: 'Quotes "and" 中文 <examples> & equations',
  date: '2026-09-07',
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
          { path: 'blog', component: MetadataTestPage },
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

  afterEach(() => document.head.querySelector('#article-structured-data')?.remove());

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
      author: [{ '@type': 'Person', name: SITE_CONFIG.author.name, url: `${SITE_CONFIG.url}/` }],
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
    await harness.navigateByUrl('/blog/second');
    expect(document.head.querySelectorAll('#article-structured-data')).toHaveLength(1);
    const data = JSON.parse(prerendered.textContent!);
    expect(data.headline).toBe(second.title);
    expect(data.datePublished).toBe(second.date);
    expect(data.url).toBe(`${SITE_CONFIG.url}/blog/second`);
    expect(data).not.toHaveProperty('image');
    expect(data).not.toHaveProperty('dateModified');

    await harness.navigateByUrl('/blog');
    expect(document.head.querySelector('#article-structured-data')).toBeNull();
    await harness.navigateByUrl('/blog/first');
    await harness.navigateByUrl('/blog/missing');
    expect(document.head.querySelector('#article-structured-data')).toBeNull();
    await harness.navigateByUrl('/');
    expect(document.head.querySelector('#article-structured-data')).toBeNull();
  });
});
