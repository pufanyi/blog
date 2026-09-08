import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import type { Post } from '../models/post.model';
import { SITE_CONFIG } from '../data/site-config';
import { PERSON_DATA } from '../data/person';
import { blogPagePath, type BlogPage } from '../utils/blog-pagination';

const NOT_FOUND_TITLE = '404: Existence Left as an Exercise';

@Injectable()
export class PageMetadataStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route = snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const post = route.data['post'] as Post | null | undefined;
    const blogPage = route.data['blogPage'] as BlogPage | null | undefined;
    const missing =
      route.routeConfig?.path === '404' ||
      route.routeConfig?.path === '**' ||
      (route.routeConfig?.path === 'blog/:slug' && !post) ||
      (route.routeConfig?.path === 'blog/page/:page' && !blogPage);
    const title = missing
      ? NOT_FOUND_TITLE
      : post
        ? `${post.title} — ${SITE_CONFIG.author.name}`
        : blogPage
          ? `${SITE_CONFIG.title}${blogPage.number > 1 ? ` — Page ${blogPage.number}` : ''}`
          : (this.buildTitle(snapshot) ?? SITE_CONFIG.title);
    const description = missing
      ? `This page could not be found. Return to ${SITE_CONFIG.author.name}’s homepage or browse the blog.`
      : (post?.description ??
        (route.data['description'] as string | undefined) ??
        SITE_CONFIG.description);
    const path = blogPage
      ? blogPagePath(blogPage.number)
      : new URL(snapshot.url, SITE_CONFIG.url).pathname.replace(/\/$/, '') || '/';
    const canonical = `${SITE_CONFIG.url}${path}`;
    const image = new URL(post?.coverImage ?? SITE_CONFIG.defaultImage, SITE_CONFIG.url).href;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({
      name: 'robots',
      content: missing || route.data['noindex'] ? 'noindex, follow' : 'index, follow',
    });
    for (const [property, content] of Object.entries({
      'og:title': title,
      'og:description': description,
      'og:url': canonical,
      'og:type': post ? 'article' : 'website',
      'og:site_name': SITE_CONFIG.title,
      'og:image': image,
    }))
      this.meta.updateTag({ property, content });
    for (const [name, content] of Object.entries({
      'twitter:card': post?.coverImage ? 'summary_large_image' : 'summary',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': image,
    }))
      this.meta.updateTag({ name, content });
    if (post) {
      this.meta.updateTag({ property: 'article:published_time', content: post.date });
      this.meta.updateTag({ property: 'article:author', content: SITE_CONFIG.url });
    } else {
      this.meta.removeTag('property="article:published_time"');
      this.meta.removeTag('property="article:author"');
    }
    if (post?.updated) {
      this.meta.updateTag({ property: 'article:modified_time', content: post.updated });
    } else {
      this.meta.removeTag('property="article:modified_time"');
    }
    this.updateLink('canonical', canonical);
    const markdownPath = missing || route.data['noindex'] ? null
      : post ? `/blog/${post.slug}.md`
        : path === '/' || path === '/cv' ? '/profile.md'
          : blogPage || path === '/blog' ? '/blog/index.md' : null;
    this.updateLink('alternate', markdownPath ? `${SITE_CONFIG.url}${markdownPath}` : null, 'text/markdown');
    this.updateLink('describedby', missing || route.data['noindex'] ? null : `${SITE_CONFIG.url}/llms.txt`, 'text/plain');
    this.updateArticleStructuredData(missing ? null : post, canonical);
    const indexable = !missing && !route.data['noindex'];
    this.updateStructuredData('profile-structured-data', indexable && (path === '/' || path === '/cv') ? {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': `${canonical}#profile`,
      url: canonical,
      mainEntity: PERSON_DATA,
    } : null);
    this.updateLink('alternate', indexable ? `${SITE_CONFIG.url}/feed.xml` : null, 'application/rss+xml');
    this.updateLink('alternate', indexable ? `${SITE_CONFIG.url}/atom.xml` : null, 'application/atom+xml');
    this.updateLink(
      'prev',
      blogPage && blogPage.number > 1
        ? `${SITE_CONFIG.url}${blogPagePath(blogPage.number - 1)}` : null,
    );
    this.updateLink(
      'next',
      blogPage && blogPage.number < blogPage.totalPages
        ? `${SITE_CONFIG.url}${blogPagePath(blogPage.number + 1)}` : null,
    );
  }

  private updateArticleStructuredData(post: Post | null | undefined, canonical: string): void {
    if (!post) {
      this.updateStructuredData('article-structured-data', null);
      return;
    }
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': `${canonical}#article`,
      url: canonical,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      ...(post.updated ? { dateModified: post.updated } : {}),
      author: [{
        '@type': 'Person',
        '@id': PERSON_DATA['@id'],
        name: SITE_CONFIG.author.name,
        url: new URL('/', SITE_CONFIG.url).href,
      }],
      ...(post.coverImage ? { image: [new URL(post.coverImage, SITE_CONFIG.url).href] } : {}),
    };
    this.updateStructuredData('article-structured-data', data);
  }

  private updateStructuredData(id: string, data: object | null): void {
    let script = this.document.head.querySelector<HTMLScriptElement>(`#${id}`);
    if (data === null) {
      script?.remove();
      return;
    }
    if (!script) {
      script = this.document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    // Escape raw-text delimiters so authored text cannot close the script in prerendered HTML.
    script.textContent = JSON.stringify(data).replaceAll('<', '\\u003c');
  }

  private updateLink(rel: string, href: string | null, type?: string): void {
    const selector = `link[rel="${rel}"]${type ? `[type="${type}"]` : ''}`;
    let link = this.document.head.querySelector<HTMLLinkElement>(selector);
    if (href === null) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.document.createElement('link');
      link.rel = rel;
      if (type) link.type = type;
      this.document.head.appendChild(link);
    }
    link.href = href;
  }
}
