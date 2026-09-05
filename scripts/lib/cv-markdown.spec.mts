import assert from 'node:assert/strict';
import test from 'node:test';
import { renderCvInlineMarkdown, renderCvMarkdown } from './cv-markdown.mts';

test('renderCvInlineMarkdown supports Markdown and preserves authored HTML', () => {
  assert.equal(
    renderCvInlineMarkdown(
      'Read the [paper](https://example.com), note **this**, and keep <em>legacy HTML</em>.',
    ),
    'Read the <a href="https://example.com">paper</a>, note <strong>this</strong>, and keep <em>legacy HTML</em>.',
  );
});

test('renderCvMarkdown renders every rich-text field without changing structural text', () => {
  const cv = {
    header: {
      name: 'Name *with asterisks*',
      photo: '',
      affiliation: [],
      contact: [],
      links: [],
    },
    abstract: { paragraphs: ['A **short** bio.'], keywords: ['Markdown'] },
    sections: [
      {
        title: 'Research *and* Development',
        content: 'Uses `inline code`.',
        entries: [
          {
            title: 'Project **name**',
            date: '2026',
            detail: '*Core developer*',
            items: ['See [project](/project).'],
          },
        ],
        subsections: [{ title: 'Awards **and honors**', items: ['Won **first place**.'] }],
      },
    ],
  };

  const rendered = renderCvMarkdown(cv);

  assert.equal(rendered.header.name, 'Name *with asterisks*');
  assert.equal(rendered.abstract.paragraphs[0], 'A <strong>short</strong> bio.');
  assert.equal(rendered.sections[0].title, 'Research *and* Development');
  assert.equal(rendered.sections[0].content, 'Uses <code>inline code</code>.');
  assert.equal(rendered.sections[0].entries?.[0].title, 'Project **name**');
  assert.equal(rendered.sections[0].entries?.[0].detail, '<em>Core developer</em>');
  assert.equal(rendered.sections[0].entries?.[0].items?.[0], 'See <a href="/project">project</a>.');
  assert.equal(rendered.sections[0].subsections?.[0].items[0], 'Won <strong>first place</strong>.');
  assert.equal(cv.abstract.paragraphs[0], 'A **short** bio.');
});
