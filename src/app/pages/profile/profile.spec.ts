import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProfilePageComponent } from './profile';

describe('ProfilePageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the shared CV abstract without the full CV sections', () => {
    const fixture = TestBed.createComponent(ProfilePageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.abstract-content p')).toHaveLength(1);
    expect(element.querySelector('.section')).toBeNull();
    expect(element.querySelector<HTMLAnchorElement>('a[href="/cv"]')?.textContent).toContain('Full CV');
  });
});
