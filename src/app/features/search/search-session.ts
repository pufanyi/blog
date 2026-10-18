import { signal } from '@angular/core';
import type { SearchResult } from '../../../contracts/search.model';
import type { SearchService } from './search.service';

/** One open search dialog owns one session; the expensive engine is shared separately. */
export class SearchSession {
  private version = 0;
  private disposed = false;
  private pendingNavigation: number | undefined;
  private readonly queryState = signal('');
  private readonly resultState = signal<SearchResult[]>([]);
  private readonly indexState = signal(0);
  private readonly loadingState = signal(true);
  private readonly failedState = signal(false);
  readonly query = this.queryState.asReadonly();
  readonly results = this.resultState.asReadonly();
  readonly activeIndex = this.indexState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly failed = this.failedState.asReadonly();

  constructor(
    private readonly engine: Pick<SearchService, 'prepare' | 'search'>,
    private readonly choose: (result: SearchResult) => void,
  ) {}

  async update(query = this.query()): Promise<void> {
    if (this.disposed) return;
    this.queryState.set(query);
    if (this.failed()) return;
    const version = ++this.version;
    this.pendingNavigation = undefined;
    this.resultState.set([]);
    this.indexState.set(0);
    this.loadingState.set(true);
    try {
      await this.engine.prepare();
      if (!this.isCurrent(version)) return;
      const results = await this.engine.search(query);
      if (!this.isCurrent(version)) return;
      this.resultState.set(results);
      if (this.pendingNavigation === version && results.length) this.choose(results[0]);
    } catch {
      if (this.isCurrent(version)) this.failedState.set(true);
    } finally {
      if (this.isCurrent(version)) this.loadingState.set(false);
    }
  }

  move(delta: number): void {
    const length = this.results().length;
    if (length) this.indexState.update((index) => (index + delta + length) % length);
  }

  highlight(index: number): void {
    if (index >= 0 && index < this.results().length) this.indexState.set(index);
  }

  select(): void {
    if (this.loading() && this.query().trim()) this.pendingNavigation = this.version;
    else {
      const selected = this.results()[this.activeIndex()];
      if (selected) this.choose(selected);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.version++;
    this.pendingNavigation = undefined;
  }

  private isCurrent(version: number): boolean {
    return !this.disposed && version === this.version;
  }
}
