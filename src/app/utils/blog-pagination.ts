import type { PostSummary } from '../models/post.model';

export interface BlogPage {
  number: number;
  totalPages: number;
  totalPosts: number;
  start: number;
  end: number;
  posts: readonly PostSummary[];
}

export function blogPageCount(totalPosts: number, pageSize: number): number {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) throw new Error('Page size must be a positive integer');
  return Math.max(1, Math.ceil(totalPosts / pageSize));
}

export function blogPagePath(page: number): string {
  return page === 1 ? '/blog' : `/blog/page/${page}`;
}

export function paginatePosts(posts: readonly PostSummary[], value: string | null, pageSize: number): BlogPage | null {
  const totalPages = blogPageCount(posts.length, pageSize);
  if (value !== null && !/^[1-9]\d*$/.test(value)) return null;
  const number = value === null ? 1 : Number(value);
  if (!Number.isSafeInteger(number) || number > totalPages) return null;
  const offset = (number - 1) * pageSize;
  return {
    number,
    totalPages,
    totalPosts: posts.length,
    start: posts.length ? offset + 1 : 0,
    end: Math.min(offset + pageSize, posts.length),
    posts: posts.slice(offset, offset + pageSize),
  };
}

export function paginationItems(page: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const visible = new Set([1, total, page - 1, page, page + 1]);
  if (page <= 3) for (let number = 2; number <= 5; number++) visible.add(number);
  if (page >= total - 2) for (let number = total - 4; number < total; number++) visible.add(number);
  const numbers = [...visible].filter(number => number > 0 && number <= total).sort((a, b) => a - b);
  const result: (number | 'ellipsis')[] = [];
  for (const [index, number] of numbers.entries()) {
    const previous = numbers[index - 1];
    if (previous !== undefined && number - previous === 2) result.push(previous + 1);
    else if (previous !== undefined && number - previous > 2) result.push('ellipsis');
    result.push(number);
  }
  return result;
}
