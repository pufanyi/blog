import { JSDOM } from 'jsdom';
import type { SiteConfig } from '../../src/app/models/config.model';
import type { CvData } from '../../src/app/models/cv.model';
import type { PersonStructuredData } from '../../src/app/models/structured-data.model';

export function buildPersonData(cv: CvData, site: SiteConfig): PersonStructuredData {
  const homepage = new URL('/', site.url).href;
  const description = cv.abstract.paragraphs
    .slice(0, 2)
    .map((html) => {
      const dom = new JSDOM(html);
      try {
        return (dom.window.document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
      } finally {
        dom.window.close();
      }
    })
    .join(' ');
  const profiles = cv.header.links
    .filter((link) => !link.internal)
    .map((link) => new URL(link.href, homepage))
    .filter(
      (url) =>
        ['http:', 'https:'].includes(url.protocol) && url.origin !== new URL(homepage).origin,
    );
  return {
    '@type': 'Person',
    '@id': `${homepage}#person`,
    name: cv.header.name,
    ...(cv.header.name !== site.author.name ? { alternateName: site.author.name } : {}),
    url: homepage,
    image: new URL(cv.header.photo, homepage).href,
    description,
    sameAs: [...new Set(profiles.map((url) => url.href))],
  };
}
