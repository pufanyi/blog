import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { CvData } from '../../src/app/models/cv.model';
import { renderCvMarkdown } from './cv-markdown.mts';
import { buildPersonData } from './person-data.mts';
import { loadSiteConfiguration } from './site-config.mts';

test('person metadata reuses bilingual CV identity and visible biography without importing the full CV at runtime', () => {
  const site = loadSiteConfiguration(fileURLToPath(new URL('../../configs', import.meta.url))).site;
  const profile = 'https://scholar.google.com/citations?user=example';
  const cv: CvData = {
    header: {
      name: `${site.author.name} 濮凡轶`,
      photo: 'me.avif',
      affiliation: ['University'],
      contact: [],
      links: [
        { label: 'Home', icon: '', href: site.url },
        { label: 'Blog', icon: '', href: '/blog', internal: true },
        { label: 'Scholar', icon: '', href: profile },
        { label: 'Duplicate', icon: '', href: profile },
        { label: 'Contact', icon: '', href: 'mailto:example@example.com' },
      ],
    },
    abstract: {
      paragraphs: ['I study **AI** & models.', 'Work at [University](https://example.com).'],
    },
    sections: [],
  };
  const original = structuredClone(cv);
  const person = buildPersonData(renderCvMarkdown(cv), site);
  assert.equal(person['@id'], `${site.url}/#person`);
  assert.equal(person.name, cv.header.name);
  assert.equal(person.alternateName, site.author.name);
  assert.equal(person.image, `${site.url}/me.avif`);
  assert.equal(person.description, 'I study AI & models. Work at University.');
  assert.deepEqual(person.sameAs, [profile]);
  assert.deepEqual(cv, original);
});
