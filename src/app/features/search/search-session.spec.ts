import { describe, expect, it, vi } from 'vitest';
import type { SearchResult } from '../../../contracts/search.model';
import { SearchSession } from './search-session';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const result = (title: string): SearchResult => ({
  id: 1,
  slug: title,
  title,
  date: '2026-10-18',
  description: '',
  content: '',
  matchField: 'title',
  snippet: '',
});

describe('search session lifetime', () => {
  it('ignores obsolete results and pending Enter when the query changes', async () => {
    const first = deferred<SearchResult[]>();
    const second = deferred<SearchResult[]>();
    const choose = vi.fn();
    const session = new SearchSession(
      {
        prepare: async () => undefined,
        search: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise),
      },
      choose,
    );
    const oldQuery = session.update('old');
    await Promise.resolve();
    session.select();
    const newQuery = session.update('new');
    await Promise.resolve();
    second.resolve([result('new')]);
    await newQuery;
    first.resolve([result('old')]);
    await oldQuery;
    expect(session.results().map((row) => row.title)).toEqual(['new']);
    expect(session.loading()).toBe(false);
    expect(choose).not.toHaveBeenCalled();
  });

  it('does not navigate or publish results after dismissal during an outstanding search', async () => {
    const pending = deferred<SearchResult[]>();
    const choose = vi.fn();
    const session = new SearchSession(
      { prepare: async () => undefined, search: () => pending.promise },
      choose,
    );
    const work = session.update('query');
    await Promise.resolve();
    session.select();
    session.dispose();
    pending.resolve([result('late')]);
    await work;
    expect(session.results()).toEqual([]);
    expect(choose).not.toHaveBeenCalled();
  });

  it('honors pending Enter once for the current query and retains loading failures', async () => {
    const pending = deferred<SearchResult[]>();
    const choose = vi.fn();
    const session = new SearchSession(
      { prepare: async () => undefined, search: () => pending.promise },
      choose,
    );
    const work = session.update('query');
    session.select();
    pending.resolve([result('first'), result('second')]);
    await work;
    expect(choose).toHaveBeenCalledExactlyOnceWith(result('first'));
    session.move(-1);
    expect(session.activeIndex()).toBe(1);
    const prepare = vi.fn().mockRejectedValue(new Error('offline'));
    const failed = new SearchSession({ prepare, search: async () => [] }, choose);
    await failed.update();
    await failed.update('retry');
    expect(failed.failed()).toBe(true);
    expect(failed.loading()).toBe(false);
    expect(prepare).toHaveBeenCalledOnce();
  });
});
