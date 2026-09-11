import { describe, expect, it } from 'vitest';
import { SearchService } from './search.service';

describe('generated search index', () => {
  it('finds Chinese words in published posts and puts title matches before body matches', () => {
    const search = new SearchService();
    expect(search.search('模型').map(result => result.slug)).toEqual(
      expect.arrayContaining(['ml/ml-revisit/ae/ml-revisit-vae', 'ml/ml-revisit/diffusion']),
    );
    const results = search.search('attention');
    expect(results[0].matchField).toBe('title');
    expect(results[0].title).toContain('Attention');
    expect(search.search('   ')).toEqual([]);
  });
});
