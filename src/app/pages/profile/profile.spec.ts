import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CvPageComponent } from '../cv/cv';
import { ProfilePageComponent } from './profile';

describe('ProfilePageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent, CvPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the shared CV abstract without the full CV sections', () => {
    const fixture = TestBed.createComponent(ProfilePageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.abstract-content p')).toHaveLength(4);
    expect(element.querySelector('.abstract-heading')).toBeNull();
    expect(element.querySelector('.section')).toBeNull();
    expect(element.querySelector('.profile-actions')).toBeNull();
    expect(element.querySelector<HTMLAnchorElement>('.icon-link[href="/cv"]')?.ariaLabel).toBe(
      'Curriculum Vitae',
    );
    expect(element.querySelector('.icon-link[href="https://pufanyi.com"]')).toBeNull();
    const iconLinks = Array.from(element.querySelectorAll<HTMLAnchorElement>('.icon-link'));
    expect(iconLinks.every(link => link.dataset['tooltip'] === link.ariaLabel)).toBe(true);
  });

  it('keeps the website link on the full CV page', () => {
    const fixture = TestBed.createComponent(CvPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector<HTMLAnchorElement>('.icon-link[href="https://pufanyi.com"]')?.ariaLabel,
    ).toBe('Homepage');
    expect(element.querySelector('.icon-link[href="/cv"]')).toBeNull();
  });
});
