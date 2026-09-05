import {
  Component,
  OnDestroy,
  afterNextRender,
  effect,
  inject,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ThemeService } from '../../services/theme.service';

const GISCUS_THEMES = {
  light: 'https://pufanyi.com/giscus-morandi-light.css',
  dark: 'https://pufanyi.com/giscus-morandi-dark.css',
} as const;

@Component({
  selector: 'app-giscus-comments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '<div class="giscus"></div>',
})
export class GiscusCommentsComponent implements OnDestroy {
  private readonly themeService = inject(ThemeService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private loaded = false;

  constructor() {
    afterNextRender(() => this.load());
    effect(() => {
      const theme = this.themeService.theme();
      if (this.loaded) {
        this.syncTheme(theme);
      }
    });
  }

  ngOnDestroy(): void {
    this.loaded = false;
  }

  load(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const container = this.host.nativeElement.querySelector('.giscus');
    if (!container) {
      return;
    }

    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'pufanyi/blog');
    script.setAttribute('data-repo-id', 'R_kgDORRRa1g');
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDORRRa1s4C2sEx');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', this.getThemeValue());
    script.setAttribute('data-lang', 'en');
    script.crossOrigin = 'anonymous';
    script.async = true;
    container.appendChild(script);
    this.loaded = true;
  }

  private getThemeValue(): string {
    return GISCUS_THEMES[this.themeService.theme()];
  }

  private syncTheme(theme: 'light' | 'dark'): void {
    if (typeof document === 'undefined') {
      return;
    }

    const iframe = this.host.nativeElement.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    if (!iframe?.contentWindow) {
      return;
    }

    iframe.contentWindow.postMessage(
      {
        giscus: {
          setConfig: {
            theme: GISCUS_THEMES[theme],
          },
        },
      },
      'https://giscus.app',
    );
  }
}
