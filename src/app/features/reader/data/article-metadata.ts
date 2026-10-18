import type { Post } from '../../../../contracts/post.model';
import { PERSON_DATA } from '../../../data/person';
import { SITE_CONFIG } from '../../../data/site-config';

export function articleAuthorNames(post: Post): readonly string[] {
  return post.authors?.length ? post.authors : [SITE_CONFIG.author.name];
}

export function articleStructuredData(
  post: Post | null | undefined,
  canonical: string,
): object | null {
  if (!post) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${canonical}#article`,
    url: canonical,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    ...(post.updated ? { dateModified: post.updated } : {}),
    author: articleAuthorNames(post).map((name) =>
      name === SITE_CONFIG.author.name
        ? {
            '@type': 'Person',
            '@id': PERSON_DATA['@id'],
            name,
            url: new URL('/', SITE_CONFIG.url).href,
          }
        : { name },
    ),
    ...(post.coverImage ? { image: [new URL(post.coverImage, SITE_CONFIG.url).href] } : {}),
  };
}
