import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { IcpcPageComponent } from './icpc';

describe('IcpcPageComponent', () => {
  it('renders the migrated ICPC acknowledgements and external profile links', async () => {
    await TestBed.configureTestingModule({ imports: [IcpcPageComponent] }).compileComponents();

    const fixture = TestBed.createComponent(IcpcPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('a'));

    expect(element.querySelector('h1')?.textContent).toBe('My ICPC Teammates');
    expect(element.querySelectorAll('.teammate-list li')).toHaveLength(6);
    expect(element.querySelectorAll('.teacher-list li')).toHaveLength(3);
    expect(links.map(link => link.getAttribute('href'))).toContain('https://github.com/Falicitas');
    expect(links.every(link => link.rel === 'noopener noreferrer')).toBe(true);
  });
});
