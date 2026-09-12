import { describe, expect, it } from 'vitest';
import { pdfSource } from './pdf-source';

describe('PDF asset source', () => {
  it('accepts published post and public PDF assets', () => {
    expect(pdfSource('/posts/example/problem.pdf')).toBe('/posts/example/problem.pdf');
    expect(pdfSource('/assets/pdf/awards/Kunming.pdf')).toBe('/assets/pdf/awards/Kunming.pdf');
    expect(pdfSource('/posts/example/题面.pdf')).toBe('/posts/example/%E9%A2%98%E9%9D%A2.pdf');
  });

  it('rejects missing files, remote URLs and paths outside PDF assets', () => {
    for (const source of [
      null,
      '',
      'https://example.com/file.pdf',
      '//example.com/file.pdf',
      'javascript:alert(1)',
      '/blog/example',
      '/posts/example/file.html',
      '/posts/../../private.pdf',
      '/posts/example/file.pdf?download=1',
      '/posts/example/file.pdf#page=2',
    ]) {
      expect(pdfSource(source), source ?? 'missing').toBeNull();
    }
  });
});
