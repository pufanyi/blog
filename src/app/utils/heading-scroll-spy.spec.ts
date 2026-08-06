import { describe, expect, it } from 'vitest';
import {
  calculateReadingProgress,
  flattenToc,
  resolveActiveHeading,
} from './heading-scroll-spy';

describe('resolveActiveHeading', () => {
  const headings = [
    { id: 'one', top: 160 },
    { id: 'two', top: 480 },
    { id: 'three', top: 900 },
  ];

  it('has no active section before the first heading reaches the activation line', () => {
    expect(resolveActiveHeading(headings, 80, false)).toBe('');
  });

  it('chooses the last heading above the activation line', () => {
    expect(
      resolveActiveHeading(
        [
          { id: 'one', top: -220 },
          { id: 'two', top: 40 },
          { id: 'three', top: 400 },
        ],
        80,
        false,
      ),
    ).toBe('two');
  });

  it('activates the final section at the bottom of the page', () => {
    expect(resolveActiveHeading(headings, 80, true)).toBe('three');
  });
});

describe('calculateReadingProgress', () => {
  it('clamps progress before and after the readable article range', () => {
    expect(calculateReadingProgress(200, 1200, 600, 80)).toBe(0);
    expect(calculateReadingProgress(-600, 1200, 600, 80)).toBe(1);
  });

  it('reports progress within the article', () => {
    expect(calculateReadingProgress(-260, 1200, 600, 80)).toBe(0.5);
  });
});

describe('flattenToc', () => {
  it('preserves document order', () => {
    expect(
      flattenToc([
        {
          id: 'one',
          text: 'One',
          level: 2,
          children: [{ id: 'one-a', text: 'One A', level: 3, children: [] }],
        },
        { id: 'two', text: 'Two', level: 2, children: [] },
      ]).map(item => item.id),
    ).toEqual(['one', 'one-a', 'two']);
  });
});
