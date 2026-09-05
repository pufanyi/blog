import { Document } from 'flexsearch';
import { SEARCH_FIELDS, type SearchDocument } from '../models/search.model';

const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });

// Keep English words intact while finding word boundaries inside Chinese prose.
// The same encoder is used for the build-time index and browser queries.
export function searchTerms(text: string): string[] {
  return Array.from(segmenter.segment(text.normalize('NFKC').toLowerCase()))
    .filter(part => part.isWordLike)
    .map(part => part.segment);
}

export function createSearchIndex(): Document<SearchDocument> {
  return new Document<SearchDocument>({
    tokenize: 'forward',
    encode: searchTerms,
    document: { id: 'id', index: [...SEARCH_FIELDS] },
  });
}
