import { TestBed } from '@angular/core/testing';
import { PostCitationComponent } from './post-citation';
import { SITE_CONFIG } from '../../data/site-config';

describe('PostCitationComponent', () => {
  it('builds a stable BibTeX entry from post metadata', () => {
    const fixture = TestBed.createComponent(PostCitationComponent);
    fixture.componentRef.setInput('title', 'Research & Development');
    fixture.componentRef.setInput('date', '2026-09-01');
    fixture.componentRef.setInput('slug', 'hello-world');
    fixture.detectChanges();

    expect(fixture.componentInstance.bibtex()).toBe(`@misc{${SITE_CONFIG.author.citationKeyPrefix}2026helloworld,
  author = {${SITE_CONFIG.author.citationName.replace(/([&%#_{}])/g, '\\$1')}},
  title  = {Research \\& Development},
  year   = {2026},
  month  = {9},
  url    = {${SITE_CONFIG.url}/blog/hello-world}
}`);
  });
});
