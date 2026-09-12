import { Injectable, InjectionToken, inject } from '@angular/core';
import type { SearchResult } from '../models/search.model';
import type { SearchEngine } from '../utils/search-engine';

type LoadedSearchEngine = Pick<SearchEngine, 'search'>;

export const SEARCH_ENGINE_LOADER = new InjectionToken<() => Promise<LoadedSearchEngine>>(
  'Search engine loader',
  {
    providedIn: 'root',
    factory: () => () => import('../utils/search-engine').then(module => new module.SearchEngine()),
  },
);

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly loadEngine = inject(SEARCH_ENGINE_LOADER);
  private engine: Promise<LoadedSearchEngine> | undefined;

  async prepare(): Promise<void> {
    await this.getEngine();
  }

  async search(query: string): Promise<SearchResult[]> {
    const q = query.trim();
    if (!q) return [];
    return (await this.getEngine()).search(q);
  }

  private getEngine(): Promise<LoadedSearchEngine> {
    // Share the load across queries and dialog openings. Browsers can cache
    // failed module imports too; the dialog offers a page reload on failure.
    return (this.engine ??= this.loadEngine());
  }
}
