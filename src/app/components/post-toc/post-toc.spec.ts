import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  const postPath = '/blog/example-post';

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PostTocComponent] }).compileComponents();
  });

  it('renders a nested navigation list with an encoded fragment', () => {
    const fixture = TestBed.createComponent(PostTocComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('postPath', postPath);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('nav[aria-label="On this page"]')).not.toBeNull();
    expect(element.querySelectorAll('.toc-list > .toc-item')).toHaveLength(1);
    expect(element.querySelectorAll('.toc-sublist > .toc-subitem')).toHaveLength(1);
    expect(element.querySelector<HTMLAnchorElement>('.toc-link')?.getAttribute('href')).toBe(
      '/blog/example-post#%E7%AC%AC%E4%B8%80%E7%AB%A0',
    );
  });

  it('marks only the active location and exposes reading progress', () => {
    const fixture = TestBed.createComponent(PostTocComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('postPath', postPath);
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

  it('opens the current chapter while preserving deliberate expansion and collapse', async () => {
    const fixture = TestBed.createComponent(PostTocComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('postPath', postPath);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector<HTMLButtonElement>('.toc-expand')!;
    const subtree = element.querySelector<HTMLElement>('.toc-subtree')!;
    expect(subtree.hasAttribute('inert')).toBe(true);
    expect(button.getAttribute('aria-controls')).toBe(subtree.id);

    button.focus();
    await fixture.whenStable();
    expect(subtree.hasAttribute('inert')).toBe(true);
    button.click();
    await fixture.whenStable();
    expect(subtree.hasAttribute('inert')).toBe(false);
    fixture.componentRef.setInput('activeHeadingId', 'details');
    await fixture.whenStable();
    button.click();
    await fixture.whenStable();
    expect(subtree.hasAttribute('inert')).toBe(true);
    expect(element.querySelector('[aria-current]')?.getAttribute('data-toc-id')).toBe('第一章');

    fixture.componentRef.setInput('activeHeadingId', '');
    fixture.componentRef.setInput('activeHeadingId', 'details');
    await fixture.whenStable();
    expect(subtree.hasAttribute('inert')).toBe(true);

    fixture.componentRef.setInput('postPath', '/blog/another-article');
    await fixture.whenStable();
    expect(subtree.hasAttribute('inert')).toBe(false);
    expect(element.querySelectorAll('[aria-current]')).toHaveLength(1);
    expect(element.querySelector('[aria-current]')?.getAttribute('data-toc-id')).toBe('details');
  });

  it('keeps focused subsections open as the reading position changes', async () => {
    const fixture = TestBed.createComponent(PostTocComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('postPath', postPath);
    fixture.componentRef.setInput('activeHeadingId', 'details');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const link = element.querySelector<HTMLAnchorElement>('.toc-sublink')!;
    link.focus();
    fixture.componentRef.setInput('activeHeadingId', '');
    await fixture.whenStable();
    expect(element.querySelector('.toc-subtree')?.hasAttribute('inert')).toBe(false);
    link.blur();
    await fixture.whenStable();
    expect(element.querySelector('.toc-subtree')?.hasAttribute('inert')).toBe(true);
  });

  it('offers ordinary clicks for enhancement while retaining native and modifier-click fallback', () => {
    const fixture = TestBed.createComponent(PostTocComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('postPath', postPath);
    fixture.detectChanges();
    const selected = vi.fn();
    fixture.componentInstance.sectionSelected.subscribe(selected);
    const click = new MouseEvent('click', { cancelable: true });
    fixture.componentInstance.selectSection(click, 'details');
    expect(selected).toHaveBeenCalledWith({ id: 'details', event: click });
    expect(click.defaultPrevented).toBe(false);
    selected.mockClear();
    fixture.componentInstance.selectSection(new MouseEvent('click', { ctrlKey: true }), 'details');
    fixture.componentInstance.selectSection(new MouseEvent('click', { button: 1 }), 'details');
    expect(selected).not.toHaveBeenCalled();
  });

  it('keeps a labeled toggle and current section when the whole outline is collapsed', async () => {
    const fixture = TestBed.createComponent(PostTocComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('postPath', postPath);
    fixture.componentRef.setInput('collapsible', true);
    fixture.componentRef.setInput('idPrefix', 'sidebar-toc');
    fixture.componentRef.setInput('activeHeadingId', 'details');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector<HTMLButtonElement>('.toc-heading-toggle')!;
    const links = element.querySelector<HTMLElement>('.toc-body')!;
    expect(button.getAttribute('aria-controls')).toBe(links.id);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    button.focus();
    button.click();
    await fixture.whenStable();
    expect(links.hasAttribute('inert')).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('.toc-collapsed-context')?.textContent).toContain('Details');
    expect(document.activeElement).toBe(button);

    fixture.componentRef.setInput('activeHeadingId', '第一章');
    await fixture.whenStable();
    expect(links.hasAttribute('inert')).toBe(true);
    expect(element.querySelector('.toc-collapsed-context')?.textContent).toContain('First chapter');
    button.click();
    await fixture.whenStable();
    expect(links.hasAttribute('inert')).toBe(false);
    button.click();
    fixture.componentRef.setInput('postPath', '/blog/next-article');
    await fixture.whenStable();
    expect(links.hasAttribute('inert')).toBe(false);
  });
});
