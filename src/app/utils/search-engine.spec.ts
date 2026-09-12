import { expect, it } from 'vitest';
import type { SearchDocument, SerializedSearchIndex } from '../models/search.model';
import { SearchEngine } from './search-engine';
import { createSearchIndex } from './search-index';

it('ranks and deduplicates title, description, and body matches using a controlled corpus', async () => {
  const documents: SearchDocument[] = [
    {
      id: 0,
      slug: 'body',
      title: 'Body match',
      date: '2026-01-01',
      description: '',
      content: `${'Before '.repeat(20)}模型 ${'after '.repeat(20)}`,
    },
    {
      id: 1,
      slug: 'description',
      title: 'Description match',
      date: '2026-01-02',
      description: '模型',
      content: '模型',
    },
    {
      id: 2,
      slug: 'title',
      title: '模型',
      date: '2026-01-03',
      description: '模型',
      content: '模型',
    },
  ];
  const index = createSearchIndex();
  for (const document of documents) index.add(document);
  const serialized: SerializedSearchIndex = [];
  await index.export(async (key, data) => {
    serialized.push([key, data]);
  });
  const engine = new SearchEngine(documents, serialized);
  const results = engine.search('  模型  ');
  expect(results.map((result) => [result.slug, result.matchField])).toEqual([
    ['title', 'title'],
    ['description', 'description'],
    ['body', 'content'],
  ]);
  expect(results[2].snippet).toMatch(/^….*模型.*…$/);
  expect(results[2].snippet.length).toBeLessThan(130);
  expect(engine.search('   ')).toEqual([]);
  expect(engine.search('unfindable')).toEqual([]);
});
