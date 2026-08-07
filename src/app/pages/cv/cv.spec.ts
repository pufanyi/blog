import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CvPageComponent } from './cv';

describe('CvPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders an editorial hero and a navigation link for every section', () => {
    const fixture = TestBed.createComponent(CvPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const sections = Array.from(element.querySelectorAll<HTMLElement>('.cv-sections .section'));
    const sectionLinks = Array.from(
      element.querySelectorAll<HTMLAnchorElement>('.cv-section-nav-link'),
    ).slice(1);

    expect(element.querySelector('.cv-hero')).not.toBeNull();
    expect(element.querySelectorAll('.abstract-content p')).toHaveLength(1);
    expect(sectionLinks).toHaveLength(sections.length);
    expect(sectionLinks.map(link => link.getAttribute('href'))).toEqual(
      sections.map(section => `#${section.id}`),
    );
  });
});
