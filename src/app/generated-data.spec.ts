import { describe, expect, it } from 'vitest';
import { CV_DATA } from './data/cv';
import { POSTS } from './data/posts';
import { REDIRECTS } from './data/redirects';

describe('generated content data', () => {
  it('loads generated data modules', () => {
    expect(POSTS.length).toBeGreaterThan(0);
    expect(Array.isArray(REDIRECTS)).toBe(true);
    expect(CV_DATA).toBeTruthy();
  });
});
