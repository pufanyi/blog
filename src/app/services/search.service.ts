import { Injectable } from '@angular/core';
import { SEARCH_DOCUMENTS, SEARCH_INDEX } from '../data/search-index';
import {
  SEARCH_FIELDS,
  type SearchDocument,
  type SearchField,
  type SearchResult,
} from '../models/search.model';
import { createSearchIndex, searchTerms } from '../utils/search-index';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly index = createSearchIndex();
  private readonly documents = new Map(SEARCH_DOCUMENTS.map(document => [document.id, document]));

  constructor() {
    for (const [key, data] of SEARCH_INDEX) this.index.import(key, data);
  }

  search(query: string): SearchResult[] {
    const q = query.trim();
    if (!q || !searchTerms(q).length) return [];
    const seen = new Map<number, { field: SearchField; document: SearchDocument }>();
    for (const group of this.index.search(q, { limit: SEARCH_DOCUMENTS.length })) {
      const field = SEARCH_FIELDS.find(candidate => candidate === group.field);
      if (!field) continue;
      for (const id of group.result) {
        const document = this.documents.get(Number(id));
        const previous = seen.get(Number(id));
        if (
          document &&
          (!previous || SEARCH_FIELDS.indexOf(field) < SEARCH_FIELDS.indexOf(previous.field))
        ) {
          seen.set(document.id, { field, document });
        }
      }
    }
    return [...seen.values()]
      .sort(
        (a, b) =>
          SEARCH_FIELDS.indexOf(a.field) - SEARCH_FIELDS.indexOf(b.field) ||
          a.document.id - b.document.id,
      )
      .map(({ field, document }) => ({
        ...document,
        matchField: field,
        snippet: this.extractSnippet(
          field === 'content' ? document.content : document.description,
          q,
        ),
      }));
  }

  private extractSnippet(text: string, query: string): string {
    const lower = text.toLowerCase();
    const terms = [query.toLowerCase(), ...searchTerms(query)];
    const match = terms.find(term => lower.includes(term));
    const offset = match ? lower.indexOf(match) : 0;
    const start = Math.max(0, offset - 60);
    const end = Math.min(text.length, offset + (match?.length ?? 0) + 60);
    return `${start ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
  }
}
