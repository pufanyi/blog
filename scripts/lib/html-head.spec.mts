import assert from 'node:assert/strict';
import test from 'node:test';
import { parseHeadElements } from './html-head.mts';

test('head metadata parsing handles attribute forms and ignores a large article body', () => {
  const body = '<mjx-container><span>formula</span></mjx-container>'.repeat(20_000);
  const elements = parseHeadElements(
    `<html><HEAD data-kind="page"><LINK href='https://example.com/a&amp;b.md' TYPE=text/markdown REL="stylesheet ALTERNATE"><meta content="noindex, follow" NAME=ROBOTS></HEAD><body>${body}<link rel="canonical" href="https://invalid.example"></body></html>`,
  );

  assert.deepEqual(elements, [
    {
      tagName: 'link',
      attributes: {
        href: 'https://example.com/a&b.md',
        type: 'text/markdown',
        rel: 'stylesheet ALTERNATE',
      },
    },
    {
      tagName: 'meta',
      attributes: { content: 'noindex, follow', name: 'ROBOTS' },
    },
  ]);
});

test('head metadata parsing supports quoted delimiters and numeric entities', () => {
  const [link] = parseHeadElements(
    '<head><link title="one > two" rel="canonical" href="https://example.com/&#x7279;&#27530;"></head>',
  );
  assert.deepEqual(link, {
    tagName: 'link',
    attributes: {
      title: 'one > two',
      rel: 'canonical',
      href: 'https://example.com/特殊',
    },
  });
});
