import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, Injectable, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
const THEME_STORAGE_KEY = 'theme';
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function readStoredTheme(): Theme | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function readSystemTheme(): Theme {
  if (typeof matchMedia === 'undefined') return 'light';
  return matchMedia(DARK_SCHEME_QUERY).matches ? 'dark' : 'light';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly override = signal<Theme | null>(readStoredTheme());
  private readonly systemTheme = signal<Theme>(readSystemTheme());

  readonly theme = computed<Theme>(() => this.override() ?? this.systemTheme());

  constructor() {
    const mediaQuery = typeof matchMedia === 'function' ? matchMedia(DARK_SCHEME_QUERY) : undefined;
    const onSchemeChange = (event: MediaQueryListEvent) => {
      this.systemTheme.set(event.matches ? 'dark' : 'light');
    };
    mediaQuery?.addEventListener('change', onSchemeChange);

    const win = this.document.defaultView;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== THEME_STORAGE_KEY) return;
      this.override.set(readStoredTheme());
    };
    win?.addEventListener('storage', onStorage);

    this.destroyRef.onDestroy(() => {
      mediaQuery?.removeEventListener('change', onSchemeChange);
      win?.removeEventListener('storage', onStorage);
    });

    effect(() => {
      const resolved = this.theme();
      const override = this.override();
      this.document.documentElement.setAttribute('data-theme', resolved);
      const meta = this.document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
      if (meta) {
        meta.content = override ?? 'light dark';
      }
    });
  }

  toggle(): void {
    const osTheme = readSystemTheme();
    const target: Theme = this.theme() === 'light' ? 'dark' : 'light';
    // Only persist an explicit override; reverting to match the OS returns to system mode.
    const nextOverride = target === osTheme ? null : target;
    this.override.set(nextOverride);

    if (typeof localStorage === 'undefined') return;
    try {
      if (nextOverride) {
        localStorage.setItem(THEME_STORAGE_KEY, nextOverride);
      } else {
        localStorage.removeItem(THEME_STORAGE_KEY);
      }
    } catch {
      // Keep the active UI state even when storage writes are blocked.
    }
  }
}
