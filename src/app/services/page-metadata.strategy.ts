import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import type { Post } from '../models/post.model';

const SITE_URL = 'https://pufanyi.com';
const SITE_NAME = "Fanyi's Blog";
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
    const missing =
      route.routeConfig?.path === '404' ||
      route.routeConfig?.path === '**' ||
      (route.routeConfig?.path === 'blog/:slug' && !post);
    const title = missing
      ? NOT_FOUND_TITLE
      : post
        ? `${post.title} — Fanyi Pu`
        : (this.buildTitle(snapshot) ?? SITE_NAME);
    const description = missing
      ? 'This page could not be found. Return to Fanyi Pu’s homepage or browse the blog.'
      : (post?.description ??
        (route.data['description'] as string | undefined) ??
        'Research, notes, and writing by Fanyi Pu.');
    const path = new URL(snapshot.url, SITE_URL).pathname.replace(/\/$/, '') || '/';
    const canonical = `${SITE_URL}${path}`;
    const image = new URL(post?.coverImage ?? '/me.avif', SITE_URL).href;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: missing ? 'noindex, follow' : 'index, follow' });
    for (const [property, content] of Object.entries({
      'og:title': title,
      'og:description': description,
      'og:url': canonical,
      'og:type': post ? 'article' : 'website',
      'og:site_name': SITE_NAME,
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
      this.meta.updateTag({ property: 'article:author', content: SITE_URL });
    } else {
      this.meta.removeTag('property="article:published_time"');
      this.meta.removeTag('property="article:author"');
    }
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = canonical;
  }
}
