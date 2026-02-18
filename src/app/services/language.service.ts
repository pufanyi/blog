import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Lang = 'en' | 'zh' | 'ja';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly current = signal<Lang>(this.getInitialLang());

  constructor() {
    effect(() => {
      const lang = this.current();
      if (this.isBrowser) {
        document.documentElement.setAttribute('lang', lang);
        localStorage.setItem('lang', lang);
      }
    });
  }

  set(lang: Lang): void {
    this.current.set(lang);
  }

  private getInitialLang(): Lang {
    if (!this.isBrowser) return 'en';
    const stored = localStorage.getItem('lang');
    if (stored === 'en' || stored === 'zh' || stored === 'ja') return stored;
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith('zh')) return 'zh';
    if (nav.startsWith('ja')) return 'ja';
    return 'en';
  }
}
