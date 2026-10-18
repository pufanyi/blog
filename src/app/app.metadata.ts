import { Injectable, inject } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { type BlogDirectory, blogDirectoryPath } from '../contracts/blog-directories';
import { type BlogPage, blogPagePath } from '../contracts/blog-pagination';
import { type DocPage, docMarkdownPath } from '../contracts/doc.model';
import type { Post } from '../contracts/post.model';
import { PERSON_DATA } from './data/person';
import { SITE_CONFIG } from './data/site-config';
import { articleAuthorNames, articleStructuredData } from './features/reader/data/article-metadata';
import { type PageMetadata, PageMetadataWriter } from './platform/page-metadata';

const NOT_FOUND_TITLE = '404: Existence Left as an Exercise';

@Injectable()
export class PageMetadataStrategy extends TitleStrategy {
  private readonly writer = inject(PageMetadataWriter);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route = snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const doc = route.data['doc'] as DocPage | undefined;
    const post = route.data['post'] as Post | null | undefined;
    const blogPage = route.data['blogPage'] as BlogPage | null | undefined;
    const directory = route.data['directory'] as BlogDirectory | undefined;
    const missing =
      route.routeConfig?.path === '404' ||
      route.routeConfig?.path === '**' ||
      ('post' in route.data && !post) ||
      ('blogPage' in route.data && !blogPage);
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

    const metadata: PageMetadata = { title, tags: [], links: [], structuredData: {} };
    const link = (rel: string, href: string | null, type?: string) =>
      metadata.links.push({ rel, href, type });
    const structured = (id: string, data: object | null) => {
      metadata.structuredData[id] = data;
    };
    metadata.tags.push({ name: 'description', content: description });
    metadata.tags.push({
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
      metadata.tags.push({ property, content });
    for (const [name, content] of Object.entries({
      'twitter:card': post?.coverImage ? 'summary_large_image' : 'summary',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': image,
    }))
      metadata.tags.push({ name, content });
    if (post) {
      const authors = articleAuthorNames(post);
      metadata.tags.push({ name: 'author', content: authors.join(', ') });
      metadata.tags.push({ property: 'article:published_time', content: post.date });
      if (authors.includes(SITE_CONFIG.author.name)) {
        metadata.tags.push({ property: 'article:author', content: SITE_CONFIG.url });
      } else {
        metadata.tags.push({ property: 'article:author', content: null });
      }
    } else {
      metadata.tags.push({ name: 'author', content: null });
      metadata.tags.push({ property: 'article:published_time', content: null });
      metadata.tags.push({ property: 'article:author', content: null });
    }
    if (post?.updated) {
      metadata.tags.push({ property: 'article:modified_time', content: post.updated });
    } else {
      metadata.tags.push({ property: 'article:modified_time', content: null });
    }
    link('canonical', canonical);
    const markdownPath =
      missing || route.data['noindex']
        ? null
        : doc
          ? docMarkdownPath(doc.slug)
          : post
            ? `/blog/${post.slug}.md`
            : directory
              ? `${blogDirectoryPath(directory.slug)}/index.md`
              : path === '/' || path === '/cv'
                ? '/profile.md'
                : blogPage || path === '/blog'
                  ? '/blog/index.md'
                  : null;
    link('alternate', markdownPath ? `${SITE_CONFIG.url}${markdownPath}` : null, 'text/markdown');
    link(
      'describedby',
      missing || route.data['noindex'] ? null : `${SITE_CONFIG.url}/llms.txt`,
      'text/plain',
    );
    structured(
      'article-structured-data',
      articleStructuredData(missing || route.data['noindex'] ? null : post, canonical),
    );
    const indexable = !missing && !route.data['noindex'];
    structured(
      'profile-structured-data',
      indexable && (path === '/' || path === '/cv')
        ? {
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            '@id': `${canonical}#profile`,
            url: canonical,
            mainEntity: PERSON_DATA,
          }
        : null,
    );
    link('alternate', indexable ? `${SITE_CONFIG.url}/feed.xml` : null, 'application/rss+xml');
    link('alternate', indexable ? `${SITE_CONFIG.url}/atom.xml` : null, 'application/atom+xml');
    link(
      'prev',
      blogPage && blogPage.number > 1
        ? `${SITE_CONFIG.url}${blogPagePath(blogPage.number - 1)}`
        : null,
    );
    link(
      'next',
      blogPage && blogPage.number < blogPage.totalPages
        ? `${SITE_CONFIG.url}${blogPagePath(blogPage.number + 1)}`
        : null,
    );
    this.writer.apply(metadata);
  }
}
