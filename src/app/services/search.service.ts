import { Injectable } from '@angular/core';
import { Document, type EnrichedDocumentSearchResults } from 'flexsearch';
import { POSTS } from '../data/posts';

interface IndexedPost {
  [key: string]: string | number;
  id: number;
  slug: string;
  title: string;
  date: string;
  description: string;
  content: string;
}

export interface SearchResult {
  slug: string;
  title: string;
  date: string;
  description: string;
  content: string;
  matchField: 'title' | 'description' | 'content';
  snippet: string;
}

const FIELD_PRIORITY: Record<string, 'title' | 'description' | 'content'> = {
  title: 'title',
  description: 'description',
  content: 'content',
};

const PRIORITY_ORDER: Array<'title' | 'description' | 'content'> = [
  'title',
  'description',
  'content',
];

@Injectable({ providedIn: 'root' })
export class SearchService {
  private index: Document<IndexedPost>;
  private postsByid = new Map<number, IndexedPost>();

  constructor() {
    this.index = new Document<IndexedPost>({
      tokenize: 'forward',
      document: {
        id: 'id',
        index: ['title', 'description', 'content'],
        store: ['slug', 'title', 'date', 'description', 'content'],
      },
    });

    for (let i = 0; i < POSTS.length; i++) {
      const post = POSTS[i];
      const doc: IndexedPost = {
        id: i,
        slug: post.slug,
        title: post.title,
        date: post.date,
        description: post.description,
        content: this.stripHtml(post.contentHtml),
      };
      this.postsByid.set(i, doc);
      this.index.add(doc);
    }
  }

  search(query: string): SearchResult[] {
    const q = query.trim();
    if (!q) return [];

    const raw = this.index.search(q, { enrich: true }) as EnrichedDocumentSearchResults<IndexedPost>;

    // Deduplicate: keep highest-priority field per post
    const seen = new Map<number, { field: 'title' | 'description' | 'content'; doc: IndexedPost }>();

    for (const group of raw) {
      const field = FIELD_PRIORITY[group.field as string];
      if (!field) continue;

      for (const entry of group.result) {
        const id = entry.id as number;
        const existing = seen.get(id);
        if (!existing || PRIORITY_ORDER.indexOf(field) < PRIORITY_ORDER.indexOf(existing.field)) {
          const doc = (entry.doc as IndexedPost | null) ?? this.postsByid.get(id);
          if (doc) seen.set(id, { field, doc });
        }
      }
    }

    // Sort by priority field, then by id (original order)
    const entries = [...seen.entries()].sort((a, b) => {
      const pa = PRIORITY_ORDER.indexOf(a[1].field);
      const pb = PRIORITY_ORDER.indexOf(b[1].field);
      return pa !== pb ? pa - pb : a[0] - b[0];
    });

    return entries.map(([, { field, doc }]) => ({
      slug: doc.slug,
      title: doc.title,
      date: doc.date,
      description: doc.description,
      content: doc.content,
      matchField: field,
      snippet: this.extractSnippet(
        field === 'title' ? doc.description : (field === 'description' ? doc.description : doc.content),
        q,
      ),
    }));
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private extractSnippet(text: string, query: string): string {
    const lower = text.toLowerCase();
    const qLower = query.toLowerCase();
    let matchIdx = lower.indexOf(qLower);
    if (matchIdx === -1) matchIdx = 0;

    const radius = 60;
    let start = Math.max(0, matchIdx - radius);
    let end = Math.min(text.length, matchIdx + query.length + radius);

    if (start > 0) {
      const space = text.indexOf(' ', start);
      if (space !== -1 && space < matchIdx) start = space + 1;
    }
    if (end < text.length) {
      const space = text.lastIndexOf(' ', end);
      if (space > matchIdx + query.length) end = space;
    }

    let snippet = text.slice(start, end).trim();
    if (start > 0) snippet = '\u2026' + snippet;
    if (end < text.length) snippet = snippet + '\u2026';
    return snippet;
  }
}
