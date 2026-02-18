import { Injectable, signal, effect } from '@angular/core';

function getInitialTheme(): 'light' | 'dark' {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') return 'dark';
    if (stored === 'light') return 'light';
  }
  if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<'light' | 'dark'>(getInitialTheme());

  constructor() {
    effect(() => {
      if (typeof document === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }

      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('theme', t);
    });
  }

  toggle() {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }
}
