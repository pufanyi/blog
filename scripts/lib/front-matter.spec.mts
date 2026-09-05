import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePostSource } from './front-matter.mts';

const VALID_FRONT_MATTER = `---
title: Example Post
date: 2026-08-08
description: An example description
---
`;

test('parsePostSource separates YAML metadata from Markdown without consuming horizontal rules', () => {
  const source = `${VALID_FRONT_MATTER}# Article\n\n---\n\nBody\n`;
  const result = parsePostSource(source, 'example.md');

  assert.deepEqual(result.metadata, {
    title: 'Example Post',
    date: '2026-08-08',
    description: 'An example description',
  });
  assert.equal(result.body, '# Article\n\n---\n\nBody\n');
});

test('parsePostSource supports CRLF, a byte-order mark, and optional cover images', () => {
  const source =
    '\uFEFF---\r\ntitle: Example\r\ndate: "2024-02-29"\r\ndescription: Test\r\ncoverImage: cover.avif\r\n---\r\nContent';
  const result = parsePostSource(source, 'example.md');

  assert.equal(result.metadata.date, '2024-02-29');
  assert.equal(result.metadata.coverImage, 'cover.avif');
  assert.equal(result.body, 'Content');
});

test('parsePostSource requires a complete front matter block', () => {
  assert.throws(
    () => parsePostSource('# Missing metadata', 'missing.md'),
    /missing\.md: must start with YAML front matter/,
  );
  assert.throws(
    () => parsePostSource('---\ntitle: Unclosed', 'unclosed.md'),
    /unclosed\.md: YAML front matter is missing its closing/,
  );
});

test('parsePostSource validates supported metadata and calendar dates', () => {
  assert.throws(
    () => parsePostSource('---\ntitle: Example\ndate: 2026-08-08\n---\nBody', 'missing.md'),
    /field "description" must be a non-empty string/,
  );
  assert.throws(
    () =>
      parsePostSource(
        '---\ntitle: Example\ndate: 2026-02-30\ndescription: Test\n---\nBody',
        'date.md',
      ),
    /field "date" must be a valid YYYY-MM-DD date/,
  );
});

test('parsePostSource supports boolean draft metadata', () => {
  const result = parsePostSource(
    '---\ntitle: Example\ndate: 2026-08-08\ndescription: Test\ndraft: true\n---\nBody',
    'draft.mdx',
  );

  assert.equal(result.metadata.draft, true);
  assert.throws(
    () =>
      parsePostSource(
        '---\ntitle: Example\ndate: 2026-08-08\ndescription: Test\ndraft: yes\n---\nBody',
        'draft.mdx',
      ),
    /field "draft" must be a boolean/,
  );
});
