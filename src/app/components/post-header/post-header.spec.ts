import { TestBed } from '@angular/core/testing';
import { PostHeaderComponent } from './post-header';

describe('PostHeaderComponent', () => {
  it('shows an authored byline only when the article supplies one', () => {
    const fixture = TestBed.createComponent(PostHeaderComponent);
    fixture.componentRef.setInput('title', 'Video compression');
    fixture.componentRef.setInput('date', '2026-09-21');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.authors')).toBeNull();

    fixture.componentRef.setInput('authors', ['Fanyi Pu', 'GPT-6 Astra', 'GPT‑5.6 Sol']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.authors')?.textContent.trim()).toBe(
      'Fanyi Pu · GPT-6 Astra · GPT‑5.6 Sol',
    );
  });
});
