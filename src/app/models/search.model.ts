export const SEARCH_FIELDS = ['title', 'description', 'content'] as const;
export type SearchField = (typeof SEARCH_FIELDS)[number];

export interface SearchDocument {
  [key: string]: string | number;
  id: number;
  slug: string;
  title: string;
  date: string;
  description: string;
  content: string;
}

export type SerializedSearchIndex = [key: string, data: string][];

export interface SearchResult extends SearchDocument {
  matchField: SearchField;
  snippet: string;
}
