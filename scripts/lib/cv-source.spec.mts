import assert from 'node:assert/strict';
import test from 'node:test';
import { dump } from 'js-yaml';
import { parseCvSource } from './cv-source.mts';

const cv = {
  header: { name: 'Example', photo: '/me.avif', affiliation: [], contact: [], links: [] },
  abstract: { paragraphs: ['Markdown **stays authored**.'] },
  sections: [{ title: 'Education', entries: [{ title: 'Example', date: '2026-09-12' }] }],
};

test('CV validation preserves rich text and plain date strings', () => {
  assert.deepEqual(parseCvSource(dump(cv)), cv);
});

test('CV validation reports the authored field for missing, mistyped, and unknown data', () => {
  assert.throws(
    () => parseCvSource(dump({ ...cv, abstract: {} })),
    /content\/cv.yaml.abstract.paragraphs: expected an array/,
  );
  assert.throws(
    () => parseCvSource(dump({ ...cv, sections: [{ title: 42 }] })),
    /sections\[0\].title: expected a string/,
  );
  assert.throws(() => parseCvSource(dump({ ...cv, typo: true })), /typo: unknown field/);
});
