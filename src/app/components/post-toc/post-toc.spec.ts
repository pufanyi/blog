import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { PostTocItem } from '../../models/post.model';
import { PostTocComponent } from './post-toc';

describe('PostTocComponent', () => {
  const items: PostTocItem[] = [
    {
      id: '第一章',
      text: 'First chapter',
      level: 2,
      children: [{ id: 'details', text: 'Details', level: 3, children: [] }],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PostTocComponent] }).compileComponents();
  });

  it('renders a nested navigation list with an encoded fragment', () => {
    const fixture = TestBed.createComponent(PostTocComponent);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('nav[aria-label="On this page"]')).not.toBeNull();
    expect(element.querySelectorAll('.toc-list > .toc-item')).toHaveLength(1);
    expect(element.querySelectorAll('.toc-sublist > .toc-subitem')).toHaveLength(1);
    expect(element.querySelector<HTMLAnchorElement>('.toc-link')?.getAttribute('href')).toBe(
      '#%E7%AC%AC%E4%B8%80%E7%AB%A0',
    );
  });

  it('marks only the active location and exposes reading progress', () => {
    const fixture = TestBed.createComponent(PostTocComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('activeHeadingId', 'details');
    fixture.componentRef.setInput('progress', 0.426);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const currentLinks = element.querySelectorAll('[aria-current="location"]');
    const progress = element.querySelector('[role="progressbar"]');

    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0]?.getAttribute('data-toc-id')).toBe('details');
    expect(progress?.getAttribute('aria-valuenow')).toBe('43');
  });
});
