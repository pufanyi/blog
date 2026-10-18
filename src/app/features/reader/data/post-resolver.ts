import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import type { Post, PostTocItem } from '../../../../contracts/post.model';
import { POST_ROUTES } from '../../../data/post-routes';
import { POST_CONTENT_LOADERS } from './post-loader.model';

export const resolvePost: ResolveFn<Post | null> = (route) => {
  const slug = route.data['slug'] as string;
  const loaders = inject(POST_CONTENT_LOADERS);
  const state = inject(TransferState);
  const key = makeStateKey<PostTocItem[]>(`post-toc:${slug}`);
  const browser = isPlatformBrowser(inject(PLATFORM_ID));
  const article = inject(DOCUMENT).querySelector<HTMLElement>('.post-body[data-post-slug]');
  if (browser && state.hasKey(key)) {
    const toc = state.get(key, []);
    state.remove(key);
    const summary = POST_ROUTES.find((post) => post.slug === slug);
    if (summary && article?.dataset['postSlug'] === slug) {
      return { ...summary, contentHtml: '', toc, prerendered: true };
    }
  }
  return import('./post-repository').then(async (module) => {
    const post = await module.loadPost(slug, loaders);
    if (!browser && post) state.set(key, post.toc);
    return post;
  });
};
