import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let schemeMatches = false;
  let schemeListeners: ((event: MediaQueryListEvent) => void)[] = [];
  let meta: HTMLMetaElement;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    meta = document.createElement('meta');
    meta.name = 'color-scheme';
    meta.content = 'light dark';
    document.head.appendChild(meta);

    schemeMatches = false;
    schemeListeners = [];
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        get matches() {
          return schemeMatches;
        },
        media: query,
        addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
          schemeListeners.push(listener);
        },
        removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => {
          schemeListeners = schemeListeners.filter((entry) => entry !== listener);
        },
      })),
    );
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    meta.remove();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.unstubAllGlobals();
  });

  it('follows the system preference without pinning localStorage until toggled', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();

    expect(service.theme()).toBe('light');
    expect(localStorage.getItem('theme')).toBeNull();
    expect(meta.content).toBe('light dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    schemeMatches = true;
    for (const listener of schemeListeners) {
      listener({ matches: true } as MediaQueryListEvent);
    }
    TestBed.flushEffects();

    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem('theme')).toBeNull();
    expect(meta.content).toBe('light dark');
  });

  it('pins an explicit override across OS changes and removes it when toggled back to system', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();

    service.toggle();
    TestBed.flushEffects();
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(meta.content).toBe('dark');

    // OS changes to dark, then back to light: explicit pin must remain.
    schemeMatches = true;
    for (const listener of schemeListeners) listener({ matches: true } as MediaQueryListEvent);
    schemeMatches = false;
    for (const listener of schemeListeners) listener({ matches: false } as MediaQueryListEvent);
    TestBed.flushEffects();
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    // Toggling back to match OS removes storage override and restores system mode.
    service.toggle();
    TestBed.flushEffects();
    expect(service.theme()).toBe('light');
    expect(localStorage.getItem('theme')).toBeNull();
    expect(meta.content).toBe('light dark');
  });

  it('syncs theme overrides from other tabs via storage events', () => {
    const service = TestBed.inject(ThemeService);
    const doc = TestBed.inject(DOCUMENT);
    TestBed.flushEffects();

    localStorage.setItem('theme', 'dark');
    doc.defaultView?.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'dark' }));
    TestBed.flushEffects();

    expect(service.theme()).toBe('dark');
    expect(meta.content).toBe('dark');
  });
});
