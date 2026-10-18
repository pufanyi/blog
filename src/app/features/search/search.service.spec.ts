import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { SEARCH_ENGINE_LOADER, SearchService } from './search.service';

describe('generated search index', () => {
  it('finds Chinese words in published posts and puts title matches before body matches', async () => {
    const search = TestBed.inject(SearchService);
    expect((await search.search('模型')).map((result) => result.slug)).toEqual(
      expect.arrayContaining(['ml/ml-revisit/ae/ml-revisit-vae', 'ml/ml-revisit/diffusion']),
    );
    const results = await search.search('attention');
    expect(results[0].matchField).toBe('title');
    expect(results[0].title).toContain('Attention');
    expect(await search.search('   ')).toEqual([]);
  });

  it('loads only on demand and shares the engine across preparation and queries', async () => {
    const engine = { search: vi.fn().mockReturnValue([]) };
    let resolveEngine!: (value: typeof engine) => void;
    const ready = new Promise<typeof engine>((resolve) => {
      resolveEngine = resolve;
    });
    const loader = vi.fn().mockReturnValue(ready);
    TestBed.configureTestingModule({
      providers: [{ provide: SEARCH_ENGINE_LOADER, useValue: loader }],
    });
    const search = TestBed.inject(SearchService);
    expect(loader).not.toHaveBeenCalled();
    expect(await search.search('  ')).toEqual([]);
    expect(loader).not.toHaveBeenCalled();
    const preparing = search.prepare();
    const results = search.search('  模型  ');
    expect(loader).toHaveBeenCalledTimes(1);
    resolveEngine(engine);
    await Promise.all([preparing, results]);
    await search.prepare();
    expect(loader).toHaveBeenCalledTimes(1);
    expect(engine.search).toHaveBeenCalledWith('模型');
  });

  it('reports a failed engine download consistently across queries', async () => {
    const loader = vi.fn().mockRejectedValue(new Error('offline'));
    TestBed.configureTestingModule({
      providers: [{ provide: SEARCH_ENGINE_LOADER, useValue: loader }],
    });
    const search = TestBed.inject(SearchService);
    await expect(search.prepare()).rejects.toThrow('offline');
    await expect(search.search('attention')).rejects.toThrow('offline');
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
