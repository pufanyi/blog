import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { CommentsConfig } from '../../models/config.model';
import { ThemeService } from '../../services/theme.service';
import { GISCUS_CONFIG, GISCUS_SITE_URL, GiscusCommentsComponent } from './giscus-comments';

const comments: CommentsConfig = {
  enabled: true,
  repo: 'example/notes',
  repoId: 'test-repo',
  category: 'Questions',
  categoryId: 'test-category',
  language: 'en',
  reactionsEnabled: false,
  inputPosition: 'top',
};

describe('configurable comments', () => {
  beforeEach(() => {
    comments.enabled = true;
    TestBed.configureTestingModule({
      providers: [
        { provide: ThemeService, useValue: { theme: signal('light') } },
        { provide: GISCUS_CONFIG, useValue: comments },
        { provide: GISCUS_SITE_URL, useValue: 'https://example.org' },
      ],
    });
  });

  it('uses the configured repository, presentation, and site theme URL', () => {
    const fixture = TestBed.createComponent(GiscusCommentsComponent);
    fixture.detectChanges();
    fixture.componentInstance.load();
    const script = fixture.nativeElement.querySelector('script') as HTMLScriptElement;
    expect(script.dataset['repo']).toBe('example/notes');
    expect(script.dataset['repoId']).toBe('test-repo');
    expect(script.dataset['category']).toBe('Questions');
    expect(script.dataset['categoryId']).toBe('test-category');
    expect(script.dataset['reactionsEnabled']).toBe('0');
    expect(script.dataset['inputPosition']).toBe('top');
    expect(script.dataset['theme']).toBe('https://example.org/giscus-morandi-light.css');
  });

  it('does not load the external script when comments are disabled', () => {
    comments.enabled = false;
    const fixture = TestBed.createComponent(GiscusCommentsComponent);
    fixture.detectChanges();
    fixture.componentInstance.load();
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
  });
});
