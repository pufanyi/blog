import { TestBed } from '@angular/core/testing';
import { PostCitationComponent } from './post-citation';

describe('PostCitationComponent', () => {
  it('builds a stable BibTeX entry from post metadata', () => {
    const fixture = TestBed.createComponent(PostCitationComponent);
    fixture.componentRef.setInput('title', 'Research & Development');
    fixture.componentRef.setInput('date', '2026-09-01');
    fixture.componentRef.setInput('slug', 'hello-world');
    fixture.detectChanges();

    expect(fixture.componentInstance.bibtex()).toBe(`@misc{pu2026helloworld,
  author = {Pu, Fanyi},
  title  = {Research \\& Development},
  year   = {2026},
  month  = {9},
  url    = {https://pufanyi.com/blog/hello-world}
}`);
  });
});
