import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { EntryComponent } from './entry';

describe('EntryComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EntryComponent] }).compileComponents();
  });

  it('renders dates and locations in separate right-hand fields', () => {
    const fixture = TestBed.createComponent(EntryComponent);
    fixture.componentRef.setInput('title', 'University of Wisconsin–Madison');
    fixture.componentRef.setInput('date', 'Sep 2026 – Present');
    fixture.componentRef.setInput('detail', 'Ph.D. in Computer Science (Incoming)');
    fixture.componentRef.setInput('location', 'Madison, WI');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.entry-date')?.textContent?.trim()).toBe(
      'Sep 2026 – Present',
    );
    expect(element.querySelector('.entry-detail-main')?.textContent?.trim()).toBe(
      'Ph.D. in Computer Science (Incoming)',
    );
    expect(element.querySelector('.entry-location')?.textContent?.trim()).toBe('Madison, WI');
  });
});
