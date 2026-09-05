import { describe, expect, it } from 'vitest';
import { createSearchIndex } from './search-index';
import type { SerializedSearchIndex } from '../models/search.model';

describe('mixed-language search index', () => {
  it('matches Chinese words without turning English queries into character matches, including after serialization', async () => {
    const index = createSearchIndex();
    index.add({
      id: 0,
      slug: 'diffusion',
      title: 'Diffusion Models',
      date: '',
      description: '',
      content: '我们假设 diffusion 模型满足正态分布。',
    });
    index.add({
      id: 1,
      slug: 'parsing',
      title: 'Compiler Design',
      date: '',
      description: '',
      content: 'Modules, operators, data, expressions and lexical analysis.',
    });
    const serialized: SerializedSearchIndex = [];
    await index.export(async (key, data) => {
      serialized.push([key, data]);
    });
    const restored = createSearchIndex();
    for (const [key, data] of serialized) restored.import(key, data);
    for (const current of [index, restored]) {
      for (const query of ['模型', 'model', 'DIFFUSION 模型']) {
        expect([...new Set(current.search(query).flatMap(group => group.result))], query).toEqual([
          0,
        ]);
      }
      expect(current.search('absentword')).toEqual([]);
    }
  });
});
