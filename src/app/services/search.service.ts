import { Injectable } from '@angular/core';
import { POSTS } from '../data/posts';
import { Post } from '../models/post.model';

export interface SearchResult {
  post: Post;
  matchField: 'title' | 'description' | 'content';
  snippet: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  search(query: string): SearchResult[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResult[] = [];

    for (const post of POSTS) {
      const titleIdx = post.title.toLowerCase().indexOf(q);
      if (titleIdx !== -1) {
        results.push({ post, matchField: 'title', snippet: post.description });
        continue;
      }

      const descIdx = post.description.toLowerCase().indexOf(q);
      if (descIdx !== -1) {
        results.push({
          post,
          matchField: 'description',
          snippet: this.extractSnippet(post.description, descIdx, q.length),
        });
        continue;
      }

      const plain = this.stripHtml(post.contentHtml);
      const contentIdx = plain.toLowerCase().indexOf(q);
      if (contentIdx !== -1) {
        results.push({
          post,
          matchField: 'content',
          snippet: this.extractSnippet(plain, contentIdx, q.length),
        });
      }
    }

    return results;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private extractSnippet(text: string, matchIdx: number, matchLen: number): string {
    const radius = 60;
    let start = Math.max(0, matchIdx - radius);
    let end = Math.min(text.length, matchIdx + matchLen + radius);

    // Align to word boundaries
    if (start > 0) {
      const space = text.indexOf(' ', start);
      if (space !== -1 && space < matchIdx) start = space + 1;
    }
    if (end < text.length) {
      const space = text.lastIndexOf(' ', end);
      if (space > matchIdx + matchLen) end = space;
    }

    let snippet = text.slice(start, end).trim();
    if (start > 0) snippet = '…' + snippet;
    if (end < text.length) snippet = snippet + '…';
    return snippet;
  }
}
